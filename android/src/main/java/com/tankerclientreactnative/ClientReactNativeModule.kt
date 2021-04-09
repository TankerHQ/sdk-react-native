package com.tankerclientreactnative

import com.facebook.react.bridge.*
import io.tanker.api.Tanker
import io.tanker.api.TankerOptions
import kotlin.random.Random

typealias TankerHandle = Int

class ClientReactNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val tankerInstances = HashMap<TankerHandle, Tanker>()
    private val androidFilesDir = reactContext.applicationContext.filesDir.absolutePath

    override fun getName(): String {
        return "ClientReactNative"
    }

    private fun createTanker(options: TankerOptions): TankerHandle {
        var key: Int
        while (true) {
            key = Random.nextInt()
            if (!tankerInstances.containsKey(key))
                break
        }
        tankerInstances[key] = Tanker(options)
        return key
    }

    private fun getTanker(handle: TankerHandle): Tanker {
        return tankerInstances[handle]!!
    }

    // Cannot await in a JS constructor
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun create(jsOptions: ReadableMap, version: String): Result<TankerHandle> {
        val options = TankerOptions()
        options.setAppId(jsOptions.getString("appId")!!)
        val writablePath = jsOptions.getString("writablePath") ?: androidFilesDir
        options.setWritablePath(writablePath)
        val url = jsOptions.getString("url")
        if (url != null)
            options.setUrl(url)
        val sdkType = jsOptions.getString("sdkType")
        if (sdkType != null)
            options.sdkType = sdkType
        else
            options.sdkType = "client-react-native"
        options.sdkVersion = version

        return syncBridge { createTanker(options) }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getNativeVersion(): String {
        return Tanker.getVersionString()
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getStatus(handle: TankerHandle): Result<Int> {
        return syncBridge { getTanker(handle).getStatus().value }
    }

    @ReactMethod
    fun prehashPassword(password: String, promise: Promise) {
        promise.resolve(Tanker.prehashPassword(password))
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getDeviceId(handle: TankerHandle): Result<String> {
        return syncBridge { getTanker(handle).getDeviceId() }
    }

    @ReactMethod()
    fun start(handle: TankerHandle, identity: String, promise: Promise) {
        return getTanker(handle).start(identity).bridge(promise) {
            it.value
        }
    }

    @ReactMethod()
    fun stop(handle: TankerHandle, promise: Promise) {
        return getTanker(handle).stop().bridge(promise)
    }

    @ReactMethod()
    fun registerIdentity(handle: TankerHandle, verificationJson: ReadableMap, promise: Promise) {
        val verification = Verification(verificationJson)
        return getTanker(handle).registerIdentity(verification).bridge(promise)
    }

    @ReactMethod()
    fun verifyIdentity(handle: TankerHandle, verificationJson: ReadableMap, promise: Promise) {
        val verification = Verification(verificationJson)
        return getTanker(handle).verifyIdentity(verification).bridge(promise)
    }

    @ReactMethod()
    fun setVerificationMethod(handle: TankerHandle, verificationJson: ReadableMap, promise: Promise) {
        val verification = Verification(verificationJson)
        return getTanker(handle).setVerificationMethod(verification).bridge(promise)
    }
}
