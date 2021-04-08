package com.tankerclientreactnative

import com.facebook.react.bridge.Promise
import io.tanker.api.TankerException
import io.tanker.api.TankerFuture

fun <T> TankerFuture<T>.bridge(promise: Promise) {
    this.then<Unit> {
        val e = it.getError()
        if (e != null) {
            if (e is TankerException) {
                promise.reject(e.errorCode.name, e)
            } else {
                promise.reject(e)
            }
        } else {
            val value = it.get()
            if (value is Unit)
                promise.resolve(null)
            else
                promise.resolve(value)
        }
    }
}

fun <T, U> TankerFuture<T>.bridge(promise: Promise, convert: (result: T) -> U) {
    this.andThen<U> {
        convert(it)
    }.bridge(promise)
}
