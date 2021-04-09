package com.tankerclientreactnative

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import io.tanker.api.ErrorCode
import io.tanker.api.TankerException
import io.tanker.api.TankerFutureException

@Suppress("UNUSED_TYPEALIAS_PARAMETER") // WritableMap is not type-safe, but we still annotate...
typealias Result<T> = WritableMap

fun makeErrorMap(code: ErrorCode, msg: String): WritableMap {
    val err = WritableNativeMap()
    err.putString("code", code.name)
    err.putString("message", msg)
    return err
}

fun <T> syncBridge(f: () -> T): Result<T> {
    val result = WritableNativeMap()
    try {
        when (val value = f()) {
            null -> result.putNull("ok")
            is Unit -> result.putNull("ok")
            is Int -> result.putInt("ok", value)
            is String -> result.putString("ok", value)
            is Boolean -> result.putBoolean("ok", value)
            is ReadableMap -> result.putMap("ok", value)
            else -> result.putMap("err", makeErrorMap(ErrorCode.INTERNAL_ERROR,
                "Trying to return unsupported type ${value!!::class.java.simpleName} in Android syncBridge"))
        }
    } catch (e: Throwable) {
        var realException = e
        while (realException is TankerFutureException)
            realException = realException.cause!!

        if (realException is TankerException) {
            result.putMap("err", makeErrorMap(realException.errorCode, realException.message!!))
        } else {
            result.putMap("err", makeErrorMap(ErrorCode.INTERNAL_ERROR, "Unexpected exception in Android syncBridge: $realException"))
        }
    }
    return result
}
