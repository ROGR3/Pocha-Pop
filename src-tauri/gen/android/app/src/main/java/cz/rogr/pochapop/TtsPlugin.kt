// Poslech: Android system text-to-speech (Korean). Registered from Rust
// (src-tauri/src/tts.rs); the game calls it through the tts_* commands and
// learns that an utterance has finished from the `tts://done` event.
package cz.rogr.pochapop

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import android.webkit.WebView
import app.tauri.Logger
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Channel
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.util.Locale

@InvokeArg
class SpeakArgs {
    var text: String = ""
    var rate: Float = 1f
    var volume: Float = 1f
    var id: String = ""
}

@InvokeArg
class HandlerArgs {
    lateinit var handler: Channel
}

@TauriPlugin
class TtsPlugin(private val activity: Activity) : Plugin(activity) {
    private var tts: TextToSpeech? = null
    private var initDone = false
    private var ready = false
    private var handler: Channel? = null
    private val waiting = mutableListOf<Invoke>()

    // started with the app (~0.5 s), so the first order does not wait
    override fun load(webView: WebView) {
        tts = TextToSpeech(activity.applicationContext) { status ->
            ready = status == TextToSpeech.SUCCESS
            if (ready) {
                tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {}
                    override fun onDone(utteranceId: String?) = done(utteranceId, false)
                    @Deprecated("old API") override fun onError(utteranceId: String?) = done(utteranceId, true)
                    override fun onError(utteranceId: String?, errorCode: Int) = done(utteranceId, true)
                    override fun onStop(utteranceId: String?, interrupted: Boolean) = done(utteranceId, true)
                })
            }
            Logger.info("tts", "init status=$status korean=${korean()}")
            synchronized(waiting) {
                initDone = true
                waiting.forEach { it.resolve(statusObj()) }
                waiting.clear()
            }
        }
    }

    private fun done(id: String?, error: Boolean) {
        handler?.send(JSObject().put("id", id ?: "").put("error", error))
    }

    /** A Korean voice that is actually installed (not only downloadable). */
    private fun korean(): Boolean {
        val t = tts ?: return false
        if (!ready) return false
        val lang = t.isLanguageAvailable(Locale.KOREAN)
        if (lang < TextToSpeech.LANG_AVAILABLE) return false
        val voices: Set<Voice> = try { t.voices ?: emptySet() } catch (e: Exception) { emptySet() }
        if (voices.isEmpty()) return true
        return voices.any { v ->
            v.locale.language == "ko" && !v.features.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)
        }
    }

    private fun statusObj() = JSObject().put("available", ready).put("korean", korean())

    @Command
    fun status(invoke: Invoke) {
        synchronized(waiting) {
            if (!initDone) { waiting.add(invoke); return }
        }
        invoke.resolve(statusObj())
    }

    @Command
    fun setEventHandler(invoke: Invoke) {
        handler = invoke.parseArgs(HandlerArgs::class.java).handler
        invoke.resolve()
    }

    @Command
    fun speak(invoke: Invoke) {
        val a = invoke.parseArgs(SpeakArgs::class.java)
        val t = tts
        if (t == null || !ready) { invoke.reject("tts not ready"); return }
        t.setLanguage(Locale.KOREAN)
        t.setSpeechRate(a.rate)
        val params = Bundle()
        params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, a.volume.coerceIn(0f, 1f))
        val r = t.speak(a.text, TextToSpeech.QUEUE_FLUSH, params, a.id)
        if (r == TextToSpeech.SUCCESS) invoke.resolve() else invoke.reject("speak failed")
    }

    @Command
    fun stop(invoke: Invoke) {
        tts?.stop()
        invoke.resolve()
    }

    /** Opens the system installer of TTS voice data. */
    @Command
    fun installData(invoke: Invoke) {
        try {
            val i = Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA)
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            activity.startActivity(i)
            invoke.resolve()
        } catch (e: Exception) {
            invoke.reject("no installer: ${e.message}")
        }
    }
}
