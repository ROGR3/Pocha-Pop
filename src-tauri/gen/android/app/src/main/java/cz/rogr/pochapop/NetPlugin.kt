// Co-op: Android 17 (API 37) drops all local-network traffic of apps targeting it
// unless they hold the runtime permission ACCESS_LOCAL_NETWORK ("Zařízení v okolí").
// Registered from Rust (src-tauri/src/localnet.rs); the game asks before hosting/joining.
package cz.rogr.pochapop

import android.app.Activity
import android.os.Build
import app.tauri.PermissionState
import app.tauri.annotation.Command
import app.tauri.annotation.Permission
import app.tauri.annotation.PermissionCallback
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

private const val LOCAL_NETWORK = "localNetwork"
private const val API_LOCAL_NETWORK = 37

@TauriPlugin(permissions = [Permission(strings = ["android.permission.ACCESS_LOCAL_NETWORK"], alias = LOCAL_NETWORK)])
class NetPlugin(activity: Activity) : Plugin(activity) {
    private fun granted() =
        Build.VERSION.SDK_INT < API_LOCAL_NETWORK || getPermissionState(LOCAL_NETWORK) == PermissionState.GRANTED

    /** Resolves {granted}; shows the system dialog when not granted yet. */
    @Command
    fun localNetwork(invoke: Invoke) {
        if (granted()) invoke.resolve(JSObject().put("granted", true))
        else requestPermissionForAlias(LOCAL_NETWORK, invoke, "localNetworkResult")
    }

    @PermissionCallback
    private fun localNetworkResult(invoke: Invoke) {
        invoke.resolve(JSObject().put("granted", granted()))
    }
}
