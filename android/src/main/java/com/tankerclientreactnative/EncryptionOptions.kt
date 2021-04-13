package com.tankerclientreactnative

import com.facebook.react.bridge.ReadableMap
import io.tanker.api.EncryptionOptions

fun EncryptionOptions(json: ReadableMap?): EncryptionOptions {
    val options = EncryptionOptions()
    if (json == null)
        return options
    json.getArray("shareWithUsers")?.let {
        val users = ArrayList<String>()
        for (i in 0 until it.size()) {
            users.add(it.getString(i)!!)
        }
        options.shareWithUsers(*users.toTypedArray())
    }
    json.getArray("shareWithGroups")?.let {
        val groups = ArrayList<String>()
        for (i in 0 until it.size()) {
            groups.add(it.getString(i)!!)
        }
        options.shareWithGroups(*groups.toTypedArray())
    }
    if (json.hasKey("shareWithSelf"))
        options.shareWithSelf(json.getBoolean("shareWithSelf"))
    return options
}
