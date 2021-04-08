package com.tankerclientreactnative

import com.facebook.react.bridge.Promise
import io.tanker.api.TankerCallback
import io.tanker.api.TankerFuture

fun <T> TankerFuture<T>.bridge(promise: Promise) {
    this.then<Unit>(TankerCallback {
        val e = it.getError()
        if (e != null) {
            promise.reject(e)
        } else {
            val value = it.get()
            if (value is Unit)
                promise.resolve(null)
            else
                promise.resolve(value)
        }
    })
}

fun <T, U> TankerFuture<T>.bridge(promise: Promise, convert: (result: T) -> U) {
    this.then<Unit>(TankerCallback {
        val e = it.getError()
        if (e != null) {
            promise.reject(e)
        } else {
            val bridgeableValue: U = convert(it.get())
            if (bridgeableValue is Unit)
                promise.resolve(null)
            else
                promise.resolve(bridgeableValue)
        }
    })
}
