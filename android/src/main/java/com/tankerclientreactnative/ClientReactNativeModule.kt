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
    fun create(jsOptions: ReadableMap): TankerHandle {
        val options = TankerOptions()
        options.setAppId(jsOptions.getString("appId")!!)
        val writablePath = jsOptions.getString("writablePath") ?: androidFilesDir
        options.setWritablePath(writablePath)
        val url = jsOptions.getString("url")
        if (url != null)
            options.setUrl(url)
        val sdkType = jsOptions.getString("sdkType")
        if (sdkType != null)
            options.setUrl(sdkType)

        return createTanker(options)
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getVersion(): String {
        return Tanker.getVersionString()
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getStatus(handle: TankerHandle): Int {
        return getTanker(handle).getStatus().value
    }

    @ReactMethod
    fun prehashPassword(password: String, promise: Promise) {
        promise.resolve(Tanker.prehashPassword(password))
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getDeviceId(handle: TankerHandle): String {
        return getTanker(handle).getDeviceId()
    }
}
