// Co-op relay: a tiny WebSocket server (host) / client (guest). Messages are
// opaque strings – the game protocol lives in src/logic/netproto.ts. Rust does
// the sockets because the Android WebView can't listen and ws:// from
// http(s)://tauri.localhost runs into mixed-content / cleartext rules.
use std::{
  collections::HashMap,
  sync::{Arc, Mutex},
  time::{Duration, Instant},
};

use futures_util::{SinkExt, StreamExt};
use serde::Serialize;
use tokio::{
  io::{AsyncRead, AsyncWrite},
  net::TcpListener,
  sync::mpsc,
  task::JoinHandle,
  time,
};
use tokio_tungstenite::{
  accept_async, connect_async,
  tungstenite::{
    protocol::{frame::coding::CloseCode, CloseFrame},
    Message,
  },
  WebSocketStream,
};

pub const DEFAULT_PORT: u16 = 47123;
/** Guests per stall (3 players with the host). */
pub const MAX_CLIENTS: usize = 2;
const PING_EVERY: Duration = Duration::from_secs(5);
const TIMEOUT: Duration = Duration::from_secs(10);
/** Close code sent to a guest when the stall is full. */
const CLOSE_FULL: u16 = 4001;

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(untagged)]
pub enum NetEvent {
  Open { pid: u32 },
  Msg { pid: u32, msg: String },
  Close { pid: u32 },
  Error { msg: String },
}

impl NetEvent {
  pub fn name(&self) -> &'static str {
    match self {
      NetEvent::Open { .. } => "net://open",
      NetEvent::Msg { .. } => "net://msg",
      NetEvent::Close { .. } => "net://close",
      NetEvent::Error { .. } => "net://error",
    }
  }
}

pub type Sink = Arc<dyn Fn(NetEvent) + Send + Sync>;
type Peers = Arc<Mutex<HashMap<u32, mpsc::UnboundedSender<Message>>>>;

/// Pump one WebSocket: incoming text → sink, channel → socket, ping every 5 s,
/// give up after 10 s without hearing anything. Returns the close code (if any).
async fn pump<S>(ws: WebSocketStream<S>, pid: u32, mut out: mpsc::UnboundedReceiver<Message>, sink: &Sink) -> Option<u16>
where
  S: AsyncRead + AsyncWrite + Unpin,
{
  let (mut tx, mut rx) = ws.split();
  let mut ping = time::interval(PING_EVERY);
  ping.tick().await;
  let mut heard = Instant::now();
  loop {
    tokio::select! {
      m = rx.next() => match m {
        Some(Ok(Message::Text(t))) => { heard = Instant::now(); sink(NetEvent::Msg { pid, msg: t.to_string() }); }
        Some(Ok(Message::Close(f))) => return f.map(|f| u16::from(f.code)),
        Some(Ok(_)) => heard = Instant::now(),
        Some(Err(_)) | None => return None,
      },
      o = out.recv() => match o {
        Some(m) => {
          let close = matches!(m, Message::Close(_));
          if tx.send(m).await.is_err() || close { return None; }
        }
        None => { let _ = tx.send(Message::Close(None)).await; return None; }
      },
      _ = ping.tick() => {
        if heard.elapsed() > TIMEOUT { return None; }
        if tx.send(Message::Ping(Vec::new().into())).await.is_err() { return None; }
      }
    }
  }
}

// ------------------------------------------------------------------ host

pub struct Host {
  pub port: u16,
  peers: Peers,
  accept: JoinHandle<()>,
}

impl Host {
  /// Listen on `port` (0.0.0.0), or a random free port when it is taken.
  pub async fn start(port: u16, max_clients: usize, sink: Sink) -> std::io::Result<Host> {
    let listener = match TcpListener::bind(("0.0.0.0", port)).await {
      Ok(l) => l,
      Err(_) => TcpListener::bind(("0.0.0.0", 0)).await?,
    };
    let port = listener.local_addr()?.port();
    let peers: Peers = Arc::default();
    let p = peers.clone();
    let accept = tokio::spawn(async move {
      let mut next = 1u32;
      loop {
        let Ok((stream, _)) = listener.accept().await else { continue };
        let _ = stream.set_nodelay(true);
        let pid = next;
        next += 1;
        let (peers, sink) = (p.clone(), sink.clone());
        tokio::spawn(async move {
          let Ok(mut ws) = accept_async(stream).await else { return };
          let rx = {
            let mut map = peers.lock().unwrap();
            if map.len() >= max_clients {
              None
            } else {
              let (tx, rx) = mpsc::unbounded_channel();
              map.insert(pid, tx);
              Some(rx)
            }
          };
          let Some(rx) = rx else {
            let _ = ws.close(Some(CloseFrame { code: CloseCode::Library(CLOSE_FULL), reason: "full".into() })).await;
            return;
          };
          sink(NetEvent::Open { pid });
          pump(ws, pid, rx, &sink).await;
          // removed by stop() / kick() already → no event
          if peers.lock().unwrap().remove(&pid).is_some() {
            sink(NetEvent::Close { pid });
          }
        });
      }
    });
    Ok(Host { port, peers, accept })
  }

  /// `to = None`: everyone.
  pub fn send(&self, to: Option<u32>, msg: &str) {
    let map = self.peers.lock().unwrap();
    for (pid, tx) in map.iter() {
      if to.is_none() || to == Some(*pid) {
        let _ = tx.send(Message::text(msg));
      }
    }
  }

  pub fn kick(&self, pid: u32) {
    if let Some(tx) = self.peers.lock().unwrap().remove(&pid) {
      let _ = tx.send(Message::Close(None));
    }
  }

  #[allow(dead_code)]
  pub fn clients(&self) -> usize {
    self.peers.lock().unwrap().len()
  }

  pub fn stop(self) {
    self.accept.abort();
    for (_, tx) in self.peers.lock().unwrap().drain() {
      let _ = tx.send(Message::Close(None));
    }
  }
}

// ------------------------------------------------------------------ guest

pub struct Client {
  out: mpsc::UnboundedSender<Message>,
}

impl Client {
  /// Connect to `ip:port`. Events come with pid 0 (= the host).
  pub async fn connect(addr: &str, sink: Sink) -> Result<Client, String> {
    let url = format!("ws://{addr}/");
    let (ws, _) = time::timeout(Duration::from_secs(5), connect_async(url.as_str()))
      .await
      .map_err(|_| "timeout".to_string())?
      .map_err(|e| e.to_string())?;
    let (tx, rx) = mpsc::unbounded_channel();
    sink(NetEvent::Open { pid: 0 });
    tokio::spawn(async move {
      let code = pump(ws, 0, rx, &sink).await;
      if code == Some(CLOSE_FULL) {
        sink(NetEvent::Error { msg: "full".into() });
      }
      sink(NetEvent::Close { pid: 0 });
    });
    Ok(Client { out: tx })
  }

  pub fn send(&self, msg: &str) {
    let _ = self.out.send(Message::text(msg));
  }

  pub fn leave(self) {
    let _ = self.out.send(Message::Close(None));
  }
}

// ------------------------------------------------------------------ addresses

/// Local IPv4 addresses, hotspot interfaces (ap*, swlan*) and private ranges first, loopback last.
pub fn local_ips() -> Vec<String> {
  let mut v: Vec<(u8, String)> = if_addrs::get_if_addrs()
    .unwrap_or_default()
    .into_iter()
    .filter_map(|i| match i.ip() {
      std::net::IpAddr::V4(ip) => Some((rank(&i.name, &ip.to_string()), ip.to_string())),
      _ => None,
    })
    .collect();
  v.sort();
  let mut out: Vec<String> = Vec::new();
  for (_, ip) in v {
    if !out.contains(&ip) {
      out.push(ip);
    }
  }
  out
}

/// Same order as `rankIps` in netproto.ts.
pub fn rank(name: &str, ip: &str) -> u8 {
  let n = name.to_ascii_lowercase();
  if ip.starts_with("127.") {
    9
  } else if n.starts_with("ap") || n.starts_with("swlan") || n.starts_with("softap") {
    0
  } else if ip.starts_with("192.168.") {
    1
  } else if ip.starts_with("10.") {
    2
  } else if ip.starts_with("172.") && ip.split('.').nth(1).and_then(|o| o.parse::<u8>().ok()).is_some_and(|o| (16..=31).contains(&o)) {
    3
  } else {
    5
  }
}

// ------------------------------------------------------------------ tauri

#[derive(Default)]
pub struct NetState {
  host: tokio::sync::Mutex<Option<Host>>,
  client: tokio::sync::Mutex<Option<Client>>,
}

#[derive(Serialize)]
pub struct HostInfo {
  port: u16,
  ips: Vec<String>,
}

fn emitter(app: tauri::AppHandle) -> Sink {
  use tauri::Emitter;
  Arc::new(move |e: NetEvent| {
    let _ = app.emit(e.name(), e.clone());
  })
}

#[tauri::command]
pub async fn net_host_start(app: tauri::AppHandle, state: tauri::State<'_, NetState>) -> Result<HostInfo, String> {
  let mut h = state.host.lock().await;
  if let Some(old) = h.take() {
    old.stop();
  }
  if let Some(c) = state.client.lock().await.take() {
    c.leave();
  }
  let host = Host::start(DEFAULT_PORT, MAX_CLIENTS, emitter(app)).await.map_err(|e| e.to_string())?;
  let info = HostInfo { port: host.port, ips: local_ips() };
  *h = Some(host);
  Ok(info)
}

#[tauri::command]
pub async fn net_host_stop(state: tauri::State<'_, NetState>) -> Result<(), String> {
  if let Some(h) = state.host.lock().await.take() {
    h.stop();
  }
  Ok(())
}

#[tauri::command]
pub async fn net_join(app: tauri::AppHandle, state: tauri::State<'_, NetState>, addr: String) -> Result<(), String> {
  let mut c = state.client.lock().await;
  if let Some(old) = c.take() {
    old.leave();
  }
  *c = Some(Client::connect(&addr, emitter(app)).await?);
  Ok(())
}

#[tauri::command]
pub async fn net_send(state: tauri::State<'_, NetState>, to: Option<u32>, msg: String) -> Result<(), String> {
  if let Some(h) = state.host.lock().await.as_ref() {
    h.send(to, &msg);
    return Ok(());
  }
  if let Some(c) = state.client.lock().await.as_ref() {
    c.send(&msg);
    return Ok(());
  }
  Err("not connected".into())
}

#[tauri::command]
pub async fn net_kick(state: tauri::State<'_, NetState>, pid: u32) -> Result<(), String> {
  if let Some(h) = state.host.lock().await.as_ref() {
    h.kick(pid);
  }
  Ok(())
}

#[tauri::command]
pub async fn net_leave(state: tauri::State<'_, NetState>) -> Result<(), String> {
  if let Some(c) = state.client.lock().await.take() {
    c.leave();
  }
  if let Some(h) = state.host.lock().await.take() {
    h.stop();
  }
  Ok(())
}

#[tauri::command]
pub fn net_local_ips() -> Vec<String> {
  local_ips()
}

// ------------------------------------------------------------------ tests

#[cfg(test)]
mod tests {
  use super::*;

  fn collector() -> (Sink, mpsc::UnboundedReceiver<NetEvent>) {
    let (tx, rx) = mpsc::unbounded_channel();
    (Arc::new(move |e| { let _ = tx.send(e); }), rx)
  }

  async fn next(rx: &mut mpsc::UnboundedReceiver<NetEvent>) -> NetEvent {
    time::timeout(Duration::from_secs(3), rx.recv()).await.expect("event timeout").expect("channel closed")
  }

  async fn host() -> (Host, mpsc::UnboundedReceiver<NetEvent>) {
    let (sink, rx) = collector();
    // port 0 → random free port, tests can run in parallel
    (Host::start(0, MAX_CLIENTS, sink).await.unwrap(), rx)
  }

  #[tokio::test]
  async fn two_clients_third_rejected() {
    let (h, mut hev) = host().await;
    let addr = format!("127.0.0.1:{}", h.port);
    let (s1, mut c1) = collector();
    let a = Client::connect(&addr, s1).await.unwrap();
    assert_eq!(next(&mut c1).await, NetEvent::Open { pid: 0 });
    assert_eq!(next(&mut hev).await, NetEvent::Open { pid: 1 });
    let (s2, mut c2) = collector();
    let _b = Client::connect(&addr, s2).await.unwrap();
    assert_eq!(next(&mut c2).await, NetEvent::Open { pid: 0 });
    assert_eq!(next(&mut hev).await, NetEvent::Open { pid: 2 });
    assert_eq!(h.clients(), 2);
    // the third is closed with "full"
    let (s3, mut c3) = collector();
    let _c = Client::connect(&addr, s3).await.unwrap();
    assert_eq!(next(&mut c3).await, NetEvent::Open { pid: 0 });
    assert_eq!(next(&mut c3).await, NetEvent::Error { msg: "full".into() });
    assert_eq!(next(&mut c3).await, NetEvent::Close { pid: 0 });
    assert_eq!(h.clients(), 2);
    // client → host
    a.send(r#"{"t":"ready"}"#);
    assert_eq!(next(&mut hev).await, NetEvent::Msg { pid: 1, msg: r#"{"t":"ready"}"#.into() });
    h.stop();
  }

  #[tokio::test]
  async fn broadcast_and_direct() {
    let (h, mut hev) = host().await;
    let addr = format!("127.0.0.1:{}", h.port);
    let (s1, mut c1) = collector();
    let (s2, mut c2) = collector();
    let _a = Client::connect(&addr, s1).await.unwrap();
    next(&mut hev).await;
    let _b = Client::connect(&addr, s2).await.unwrap();
    next(&mut hev).await;
    next(&mut c1).await;
    next(&mut c2).await;
    h.send(None, "all");
    assert_eq!(next(&mut c1).await, NetEvent::Msg { pid: 0, msg: "all".into() });
    assert_eq!(next(&mut c2).await, NetEvent::Msg { pid: 0, msg: "all".into() });
    h.send(Some(2), "only b");
    assert_eq!(next(&mut c2).await, NetEvent::Msg { pid: 0, msg: "only b".into() });
    assert!(time::timeout(Duration::from_millis(200), c1.recv()).await.is_err());
    h.stop();
  }

  #[tokio::test]
  async fn disconnects() {
    let (h, mut hev) = host().await;
    let addr = format!("127.0.0.1:{}", h.port);
    let (s1, mut c1) = collector();
    let a = Client::connect(&addr, s1).await.unwrap();
    assert_eq!(next(&mut hev).await, NetEvent::Open { pid: 1 });
    next(&mut c1).await;
    // guest leaves → host hears close, a free seat again
    a.leave();
    assert_eq!(next(&mut hev).await, NetEvent::Close { pid: 1 });
    assert_eq!(h.clients(), 0);
    let (s2, mut c2) = collector();
    let _b = Client::connect(&addr, s2).await.unwrap();
    assert_eq!(next(&mut hev).await, NetEvent::Open { pid: 2 });
    next(&mut c2).await;
    // host closes the stall → guest hears close
    h.stop();
    assert_eq!(next(&mut c2).await, NetEvent::Close { pid: 0 });
  }

  #[tokio::test]
  async fn busy_port_falls_back() {
    let (h1, _e1) = host().await;
    let (sink, _e2) = collector();
    let h2 = Host::start(h1.port, MAX_CLIENTS, sink).await.unwrap();
    assert_ne!(h1.port, h2.port);
    h1.stop();
    h2.stop();
  }

  #[tokio::test]
  async fn connect_fails_cleanly() {
    let (sink, _rx) = collector();
    assert!(Client::connect("127.0.0.1:1", sink).await.is_err());
  }

  #[test]
  fn ip_ranking() {
    assert_eq!(rank("ap0", "192.168.43.1"), 0);
    assert_eq!(rank("swlan0", "10.0.0.1"), 0);
    assert_eq!(rank("wlan0", "192.168.1.5"), 1);
    assert_eq!(rank("wlan0", "10.1.1.5"), 2);
    assert_eq!(rank("eth0", "172.20.0.2"), 3);
    assert_eq!(rank("rmnet0", "100.64.3.2"), 5);
    assert_eq!(rank("lo", "127.0.0.1"), 9);
    assert!(local_ips().iter().all(|ip| ip.parse::<std::net::Ipv4Addr>().is_ok()));
  }
}
