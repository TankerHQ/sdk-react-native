package com.tanker.clientreactnative

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
    json.getString("oidcAuthorizationCode")?.let { oidcAuthorizationCode ->
        return OIDCAuthorizationCodeVerification(
            json.getString("oidcProviderId")!!,
            oidcAuthorizationCode,
            json.getString("oidcState")!!
        )
    }
    json.getString("oidcIdToken")?.let {
        return OIDCIDTokenVerification(it)
    }
    json.getString("phoneNumber")?.let {
        return PhoneNumberVerification(it, json.getString("verificationCode")!!)
    }
    json.getString("preverifiedEmail")?.let {
        return PreverifiedEmailVerification(it)
    }
    json.getString("preverifiedPhoneNumber")?.let {
        return PreverifiedPhoneNumberVerification(it)
    }
    json.getString("e2ePassphrase")?.let {
        return E2ePassphraseVerification(it)
    }
    throw AssertionError("Invalid verification JS object received, check Typescript definitions match")
}

fun VerificationOptions(json: ReadableMap?): VerificationOptions {
    val options = VerificationOptions()
    if (json == null)
        return options
    if (json.hasKey("withSessionToken"))
        options.withSessionToken(json.getBoolean("withSessionToken"))
    if (json.hasKey("allowE2eMethodSwitch"))
        options.allowE2eMethodSwitch(json.getBoolean("allowE2eMethodSwitch"))
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
        is PhoneNumberVerificationMethod -> {
            json.putString("type", "phoneNumber")
            json.putString("phoneNumber", this.phoneNumber)
        }
        is PreverifiedEmailVerificationMethod -> {
            json.putString("type", "preverifiedEmail")
            json.putString("preverifiedEmail", this.preverifiedEmail)
        }
        is PreverifiedPhoneNumberVerificationMethod -> {
            json.putString("type", "preverifiedPhoneNumber")
            json.putString("preverifiedPhoneNumber", this.preverifiedPhoneNumber)
        }
        is E2ePassphraseVerificationMethod -> json.putString("type", "e2ePassphrase")
    }
    return json
}
