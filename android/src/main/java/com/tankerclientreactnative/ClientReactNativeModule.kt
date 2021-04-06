package com.tankerclientreactnative

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import io.tanker.api.Tanker

class ClientReactNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "ClientReactNative"
    }

    @ReactMethod
    fun getVersion(): String {
        return Tanker.getVersionString()
    }
}
