import { describe, expect, it } from 'vitest';
import { DEFAULT_PORT, PROTO, answerMatches, cleanName, decode, encode, parseQr, qrPayload, rankIps, resolveCode, shortCode, type Msg, type OrderData } from '../src/logic/netproto';

const order: OrderData = {
  tokens: [{ id: 'jihacheol', ko: '지하철' }], target: '지하철', alts: [[{ id: 'beoseu', ko: '버스' }]],
  cs: 'Jedu na letiště.', icons: ['airport'], extra: '공항', kind: 'generic',
};

describe('netproto v2 (Poslech)', () => {
  it('protocol version 2, start carries the track', () => {
    expect(PROTO).toBe(2);
    const m = decode(encode({ t: 'start', night: 3, seed: 1, district: 'euljiro', seats: 3, total: 9, track: 'listen' }));
    expect(m && m.t === 'start' && m.track).toBe('listen');
    // an old host's start (no track) is still valid = Čtení
    const old = decode(JSON.stringify({ t: 'start', night: 3, seed: 1, district: 'euljiro', seats: 3, total: 9 }));
    expect(old && old.t === 'start' && old.track).toBeUndefined();
    expect(decode(JSON.stringify({ t: 'start', night: 3, seed: 1, district: 'euljiro', seats: 3, total: 9, track: 'sing' }))).toBeNull();
  });
});

describe('netproto', () => {
  it('round-trips every message type', () => {
    const msgs: Msg[] = [
      { t: 'hello', proto: PROTO, name: '민지', color: 'blue' },
      { t: 'ready' },
      { t: 'done', cid: 3, words: ['jihacheol'], ms: 1200, clean: true, hinted: false },
      { t: 'miss', cid: -1 },
      { t: 'bye' },
      { t: 'welcome', pid: 1, players: [{ pid: 0, name: 'A', color: 'orange' }, { pid: 1, name: 'B', color: 'blue' }] },
      { t: 'reject', reason: 'full' },
      { t: 'lobby', players: [], night: 7 },
      { t: 'start', night: 7, seed: 42, district: 'hangang', seats: 4, total: 14 },
      { t: 'start', night: 7, seed: 42, district: 'hangang', seats: 4, total: 14, track: 'listen' },
      { t: 'spawn', cid: 1, seat: 3, look: 'char_cust_a', order, patienceMs: 30000, at: 1500 },
      { t: 'served', cid: 1, pid: 0, coins: 12 },
      { t: 'runoff', cid: 1, pid: 1, coins: 4 },
      { t: 'close', cid: 1 },
      { t: 'leave', cid: 1, happy: false },
      { t: 'tick', ms: 4000 },
      { t: 'end', summary: { night: 7, stars: 3, total: 14, served: 13, angry: 1, mistakes: 2, players: [{ pid: 0, name: 'A', color: 'orange', first: 8, runoff: 2, coins: 120, bestCombo: 5, mistakes: 1 }] } },
      { t: 'kick' },
      { t: 'hostLeft' },
    ];
    for (const m of msgs) expect(decode(encode(m))).toEqual(m);
  });
  it('rejects invalid input', () => {
    for (const bad of [null, 42, '', 'nope', '[]', '{}', '{"t":"wat"}', '{"t":"hello","proto":"1","name":"a","color":"blue"}',
      '{"t":"hello","proto":1,"name":"a","color":"purple"}', '{"t":"done","cid":1,"words":[],"ms":5}', '{"t":"done","cid":1.5,"words":["a"],"ms":5}',
      '{"t":"spawn","cid":1,"seat":7,"look":"x","order":{},"patienceMs":5,"at":0}', '{"t":"reject","reason":"bored"}', '{"t":"leave","cid":1}',
      '{"t":"lobby","players":[{"pid":0,"name":"a","color":"orange"},{"pid":1,"name":"b","color":"orange"},{"pid":2,"name":"c","color":"orange"},{"pid":3,"name":"d","color":"orange"}],"night":1}',
      'x'.repeat(20000)]) {
      expect(decode(bad)).toBeNull();
    }
    expect(decode('{"t":"constructor"}')).toBeNull();
    expect(decode('{"t":"__proto__"}')).toBeNull();
  });
  it('version is part of hello', () => {
    const m = decode(encode({ t: 'hello', proto: 99, name: 'x', color: 'green' }));
    expect(m && m.t === 'hello' && m.proto).toBe(99);
  });
  it('answer check accepts the target or an alternative', () => {
    expect(answerMatches(order, ['jihacheol'])).toBe(true);
    expect(answerMatches(order, ['beoseu'])).toBe(true);
    expect(answerMatches(order, ['taeksi'])).toBe(false);
    expect(answerMatches(order, ['jihacheol', 'pyo'])).toBe(false);
  });
  it('names: trimmed, max 8 characters', () => {
    expect(cleanName('  김  민지 ')).toBe('김 민지');
    expect(cleanName('Bartoloměj')).toBe('Bartolom');
  });
  it('QR payload and short codes', () => {
    expect(qrPayload('192.168.43.1', DEFAULT_PORT)).toBe(`pochapop:${PROTO}:192.168.43.1:47123`);
    expect(parseQr('pochapop:1:192.168.43.1:47123')).toEqual({ proto: 1, ip: '192.168.43.1', port: 47123 });
    expect(parseQr('https://example.com')).toBeNull();
    expect(shortCode('192.168.43.1', DEFAULT_PORT)).toBe('43.1');
    expect(shortCode('10.0.5.20', 5000)).toBe('5.20:5000');
    expect(resolveCode('43.1', '192.168.43.77')).toEqual({ ip: '192.168.43.1', port: DEFAULT_PORT });
    expect(resolveCode('5,20:5000', '10.0.1.1')).toEqual({ ip: '10.0.5.20', port: 5000 });
    expect(resolveCode('192.168.1.9', null)).toEqual({ ip: '192.168.1.9', port: DEFAULT_PORT });
    expect(resolveCode('43.1', null)).toBeNull();
    expect(resolveCode('43.999', '192.168.0.1')).toBeNull();
    expect(resolveCode('43.1:99999', '192.168.0.1')).toBeNull();
  });
  it('prefers hotspot interfaces, loopback last', () => {
    expect(rankIps([
      { name: 'lo', ip: '127.0.0.1' }, { name: 'rmnet0', ip: '100.64.3.2' }, { name: 'wlan0', ip: '10.1.1.5' }, { name: 'ap0', ip: '192.168.43.1' },
    ])).toEqual(['192.168.43.1', '10.1.1.5', '100.64.3.2', '127.0.0.1']);
  });
});
