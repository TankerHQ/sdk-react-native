package com.tankerclientreactnative

import com.facebook.react.bridge.ReadableMap
import io.tanker.api.*

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
