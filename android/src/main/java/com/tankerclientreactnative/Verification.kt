package com.tankerclientreactnative

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import io.tanker.api.*
import io.tanker.bindings.TankerVerification

// This is really a package-method used as an "extension constructor" ersatz
fun Verification(json: ReadableMap): Verification {
    json.getString("email")?.let {
        return EmailVerification(it, json.getString("verificationCode")!!)
    }
    json.getString("passphrase")?.let {
        return PassphraseVerification(it)
    }
    json.getString("verificationKey")?.let {
        return VerificationKeyVerification(it)
    }
    json.getString("oidcIdToken")?.let {
        return OIDCIDTokenVerification(it)
    }
    throw AssertionError("Invalid verification JS object received, check Typescript definitions match")
}

fun VerificationOptions(json: ReadableMap?): VerificationOptions {
    val options = VerificationOptions()
    if (json == null)
        return options
    if (json.hasKey("withSessionToken"))
        options.withSessionToken(json.getBoolean("withSessionToken"))
    return options
}

fun VerificationMethod.toWritableMap(): WritableMap {
    val json = WritableNativeMap()
    when (this) {
        is EmailVerificationMethod -> {
            json.putString("type", "email")
            json.putString("email", this.email)
        }
        is VerificationKeyVerificationMethod -> json.putString("type", "verificationKey")
        is PassphraseVerificationMethod -> json.putString("type", "passphrase")
        is OIDCIDTokenVerificationMethod -> json.putString("type", "oidcIdToken")
    }
    return json
}
