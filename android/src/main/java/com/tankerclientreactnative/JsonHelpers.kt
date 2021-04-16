package com.tankerclientreactnative

import com.facebook.react.bridge.ReadableArray

fun ReadableArray.toStringArray(): Array<String> {
    val strings = ArrayList<String>()
    for (i in 0 until this.size()) {
        strings.add(this.getString(i)!!)
    }
    return strings.toTypedArray()
}
