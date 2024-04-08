package com.tanker.clientreactnative

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

abstract class ClientReactNativeSpec internal constructor(context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {

    abstract fun create(jsOptions: ReadableMap, version: String): Result<TankerHandle>
    abstract fun getNativeVersion(): String
    abstract fun getStatus(handle: TankerHandle): Result<Int>
    abstract fun prehashPassword(password: String, promise: Promise)
    abstract fun start(handle: TankerHandle, identity: String, promise: Promise)
    abstract fun stop(handle: TankerHandle, promise: Promise)
    abstract fun createOidcNonce(handle: TankerHandle, promise: Promise)
    abstract fun setOidcTestNonce(handle: TankerHandle, nonce: String, promise: Promise)
    abstract fun registerIdentity(
        handle: TankerHandle,
        verificationJson: ReadableMap,
        optionsJson: ReadableMap?,
        promise: Promise
    )

    abstract fun verifyIdentity(
        handle: TankerHandle,
        verificationJson: ReadableMap,
        optionsJson: ReadableMap?,
        promise: Promise
    )

    abstract fun setVerificationMethod(
        handle: TankerHandle,
        verificationJson: ReadableMap,
        optionsJson: ReadableMap?,
        promise: Promise
    )

    abstract fun encryptString(
        handle: TankerHandle,
        clearText: String,
        optionsJson: ReadableMap?,
        promise: Promise
    )

    abstract fun decryptString(handle: TankerHandle, encryptedTextB64: String, promise: Promise)
    abstract fun encryptData(
        handle: TankerHandle,
        clearDataB64: String,
        optionsJson: ReadableMap?,
        promise: Promise
    )

    abstract fun decryptData(handle: TankerHandle, encryptedTextB64: String, promise: Promise)
    abstract fun getResourceId(handle: TankerHandle, encryptedHeaderB64: String, promise: Promise)
    abstract fun share(
        handle: TankerHandle,
        resourceIdsJson: ReadableArray,
        optionsJson: ReadableMap,
        promise: Promise
    )

    abstract fun generateVerificationKey(handle: TankerHandle, promise: Promise)
    abstract fun getVerificationMethods(handle: TankerHandle, promise: Promise)
    abstract fun createGroup(handle: TankerHandle, userIdsJson: ReadableArray, promise: Promise)
    abstract fun updateGroupMembers(
        handle: TankerHandle,
        groupId: String,
        args: ReadableMap,
        promise: Promise
    )

    abstract fun attachProvisionalIdentity(handle: TankerHandle, identity: String, promise: Promise)
    abstract fun verifyProvisionalIdentity(
        handle: TankerHandle,
        verificationJson: ReadableMap,
        promise: Promise
    )

    abstract fun createEncryptionSession(
        handle: TankerHandle,
        optionsJson: ReadableMap?,
        promise: Promise
    )

    abstract fun encryptionSessionDestroy(handle: EncryptionSessionHandle): Result<Unit>
    abstract fun encryptionSessionGetResourceId(handle: EncryptionSessionHandle): Result<String>
    abstract fun encryptionSessionEncryptString(
        handle: EncryptionSessionHandle,
        clearText: String,
        promise: Promise
    )

    abstract fun encryptionSessionEncryptData(
        handle: EncryptionSessionHandle,
        clearDataB64: String,
        promise: Promise
    )
}
