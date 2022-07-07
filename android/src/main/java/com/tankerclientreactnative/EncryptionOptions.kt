package com.tankerclientreactnative

import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import io.tanker.api.EncryptionOptions
import io.tanker.api.Padding

private fun convertPaddingStep(paddingStep: Int): Padding =
    when (paddingStep) {
        0 -> Padding.auto
        1 -> Padding.off
        else -> Padding.step(paddingStep)
    }

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

    if (json.hasKey("paddingStep"))
        options.paddingStep(convertPaddingStep(json.getInt("paddingStep")))

    return options
}
