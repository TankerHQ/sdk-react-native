package com.tanker.clientreactnative

import android.util.Log
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import io.tanker.api.ErrorCode
import io.tanker.api.TankerException
import io.tanker.api.TankerFutureException

@Suppress("UNUSED_TYPEALIAS_PARAMETER") // WritableMap is not type-safe, but we still annotate...
typealias Result<T> = WritableMap

fun Err(code: ErrorCode, msg: String): WritableMap {
    val result = WritableNativeMap()
    val err = WritableNativeMap()
    err.putString("code", code.name)
    err.putString("message", msg)
    result.putMap("err", err)
    return result
}

fun <T> Ok(value: T): Result<T> {
    val result = WritableNativeMap()
    when (value) {
        null -> result.putNull("ok")
        is Unit -> result.putNull("ok")
        is Int -> result.putInt("ok", value)
        is Double -> result.putDouble("ok", value)
        is String -> result.putString("ok", value)
        is Boolean -> result.putBoolean("ok", value)
        is ReadableMap -> result.putMap("ok", value)
        else -> return Err(ErrorCode.INTERNAL_ERROR,
            "Trying to return unsupported type ${value!!::class.java.simpleName} in Android syncBridge")
    }
    return result
}

fun <T> syncBridge(f: () -> T): Result<T> {
    return try {
        val value = f()
        Ok(value)
    } catch (e: Throwable) {
        var realException = e
        while (realException is TankerFutureException)
            realException = realException.cause!!

        if (realException is TankerException) {
            Log.e("tanker", realException.errorCode.toString() + " --- " + realException.message!!)
            Err(realException.errorCode, realException.message!!)
        } else {
          Log.e("tanker", "Unexpected exception in Android syncBridge: $realException")
            Err(ErrorCode.INTERNAL_ERROR, "Unexpected exception in Android syncBridge: $realException")
        }
    }
}
