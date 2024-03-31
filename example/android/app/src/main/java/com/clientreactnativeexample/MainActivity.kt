package com.clientreactnativeexample

import android.os.Bundle
import android.os.PersistableBundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactInstanceManager
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import com.facebook.react.modules.network.NetworkingModule


class MainActivity : ReactActivity() {
  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "ClientReactNativeExample"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onResume() {
    super.onResume()

    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // Detox can fail because the NetworkingModule is not initialized yet
      // We force it to initialize here (as soon as the JS bundle is loaded,
      // when the ReactContext becomes available)
      reactInstanceManager.addReactInstanceEventListener {
        val netModule = it.getNativeModule(NetworkingModule::class.java)
        println("Networking module loaded: $netModule")
      }
    }
  }
}
