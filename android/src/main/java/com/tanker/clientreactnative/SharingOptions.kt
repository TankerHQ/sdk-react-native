package com.tanker.clientreactnative

import com.facebook.react.bridge.ReadableMap
import io.tanker.api.SharingOptions

fun SharingOptions(json: ReadableMap): SharingOptions {
    val options = SharingOptions()
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
    return options
}
