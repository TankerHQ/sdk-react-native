package com.tanker.clientreactnative

import com.facebook.react.bridge.Promise
import io.tanker.api.TankerException
import io.tanker.api.TankerFuture
import io.tanker.api.TankerFutureException

fun <T> TankerFuture<T>.bridge(promise: Promise) {
    this.then<Unit> {
        var e = it.getError()
        if (e != null) {
            while (e is TankerFutureException)
                e = e.cause!!

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
