package com.tankerclientreactnative

import android.util.Base64
import com.facebook.react.bridge.*
import io.tanker.api.*
import kotlin.collections.HashMap
import kotlin.random.Random

typealias TankerHandle = Int
typealias EncSessHandle = Int

// NOTE: In the same spirit as PHP "helping" by silently casting text to numbers,
//       by default Android "helps" by magically adding newlines ('wrapping') to its Base64.
// (also note that, confusingly, "or" is not boolean or, it is bitor)
const val BASE64_SANE_FLAGS = Base64.DEFAULT or Base64.NO_WRAP

class ClientReactNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val tankerInstances = HashMap<TankerHandle, Tanker>()
    private val encSessInstances = HashMap<EncSessHandle, EncryptionSession>()
    private val androidFilesDir = reactContext.applicationContext.filesDir.absolutePath

    override fun getName(): String {
        return "ClientReactNative"
    }

    private fun createTanker(options: TankerOptions): TankerHandle {
        var key: Int
        while (true) {
            key = Random.nextInt()
            if (!tankerInstances.containsKey(key))
                break
        }
        tankerInstances[key] = Tanker(options)
        return key
    }

    private fun getTanker(handle: TankerHandle): Tanker {
        return tankerInstances[handle]!!
    }

    private fun destroyTanker(handle: TankerHandle) {
        tankerInstances.remove(handle)
    }

    private fun storeEncSess(encSess: EncryptionSession): EncSessHandle {
        var key: Int
        while (true) {
            key = Random.nextInt()
            if (!encSessInstances.containsKey(key))
                break
        }
        encSessInstances[key] = encSess
        return key
    }

    private fun getEncryptionSession(handle: EncSessHandle): EncryptionSession {
        return encSessInstances[handle]!!
    }

    private fun destroyEncryptionSession(handle: EncSessHandle) {
        encSessInstances.remove(handle)
    }

    // Cannot await in a JS constructor
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun create(jsOptions: ReadableMap, version: String): Result<TankerHandle> {
        val options = TankerOptions()
        options.setAppId(jsOptions.getString("appId")!!)
        val writablePath = jsOptions.getString("writablePath") ?: androidFilesDir
        options.setWritablePath(writablePath)
        val url = jsOptions.getString("url")
        if (url != null)
            options.setUrl(url)
        val sdkType = jsOptions.getString("sdkType")
        if (sdkType != null)
            options.sdkType = sdkType
        else
            options.sdkType = "client-react-native"
        options.sdkVersion = version

        return syncBridge { createTanker(options) }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun destroy(handle: EncSessHandle): Result<Unit> {
        return syncBridge { destroyTanker(handle) }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getNativeVersion(): String {
        return Tanker.getVersionString()
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getStatus(handle: TankerHandle): Result<Int> {
        return syncBridge { getTanker(handle).getStatus().value }
    }

    @ReactMethod
    fun prehashPassword(password: String, promise: Promise) {
        TankerFuture<Unit>().andThen<String> {
            Tanker.prehashPassword(password)
        }.bridge(promise)
    }

    @ReactMethod()
    fun getDeviceId(handle: TankerHandle, promise: Promise) {
        TankerFuture<Unit>().andThen<String> {
            getTanker(handle).getDeviceId()
        }.bridge(promise)
    }

    @ReactMethod()
    fun start(handle: TankerHandle, identity: String, promise: Promise) {
        return getTanker(handle).start(identity).bridge(promise) {
            it.value
        }
    }

    @ReactMethod()
    fun stop(handle: TankerHandle, promise: Promise) {
        return getTanker(handle).stop().bridge(promise)
    }

    @ReactMethod()
    fun registerIdentity(handle: TankerHandle, verificationJson: ReadableMap, optionsJson: ReadableMap?, promise: Promise) {
        val verification = Verification(verificationJson)
        val options = VerificationOptions(optionsJson)
        return getTanker(handle).registerIdentity(verification, options).bridge(promise)
    }

    @ReactMethod()
    fun verifyIdentity(handle: TankerHandle, verificationJson: ReadableMap, optionsJson: ReadableMap?, promise: Promise) {
        val verification = Verification(verificationJson)
        val options = VerificationOptions(optionsJson)
        return getTanker(handle).verifyIdentity(verification, options).bridge(promise)
    }

    @ReactMethod()
    fun setVerificationMethod(handle: TankerHandle, verificationJson: ReadableMap, optionsJson: ReadableMap?, promise: Promise) {
        val verification = Verification(verificationJson)
        val options = VerificationOptions(optionsJson)
        return getTanker(handle).setVerificationMethod(verification, options).bridge(promise)
    }

    @ReactMethod()
    fun encryptString(handle: TankerHandle, clearText: String, optionsJson: ReadableMap?, promise: Promise) {
        val options = EncryptionOptions(optionsJson)
        return getTanker(handle).encrypt(clearText.toByteArray(), options).bridge(promise) {
            Base64.encodeToString(it, BASE64_SANE_FLAGS)
        }
    }

    @ReactMethod()
    fun decryptString(handle: TankerHandle, encryptedTextB64: String, promise: Promise) {
        val encryptedText = try {
            Base64.decode(encryptedTextB64, BASE64_SANE_FLAGS)
        } catch (e: IllegalArgumentException) {
            promise.reject(ErrorCode.INVALID_ARGUMENT.name, e)
            return
        }
        return getTanker(handle).decrypt(encryptedText).bridge(promise) {
            String(it)
        }
    }

    @ReactMethod()
    fun encryptData(handle: TankerHandle, clearDataB64: String, optionsJson: ReadableMap?, promise: Promise) {
        val clearData = try {
            Base64.decode(clearDataB64, BASE64_SANE_FLAGS)
        } catch (e: IllegalArgumentException) {
            promise.reject(ErrorCode.INVALID_ARGUMENT.name, e)
            return
        }
        val options = EncryptionOptions(optionsJson)
        return getTanker(handle).encrypt(clearData, options).bridge(promise) {
            Base64.encodeToString(it, BASE64_SANE_FLAGS)
        }
    }

    @ReactMethod()
    fun decryptData(handle: TankerHandle, encryptedTextB64: String, promise: Promise) {
        val encryptedText = try {
            Base64.decode(encryptedTextB64, BASE64_SANE_FLAGS)
        } catch (e: IllegalArgumentException) {
            promise.reject(ErrorCode.INVALID_ARGUMENT.name, e)
            return
        }
        return getTanker(handle).decrypt(encryptedText).bridge(promise) {
            Base64.encodeToString(it, BASE64_SANE_FLAGS)
        }
    }

    @ReactMethod()
    fun getResourceId(handle: TankerHandle, encryptedHeaderB64: String, promise: Promise) {
        val encryptedHeader = try {
            Base64.decode(encryptedHeaderB64, BASE64_SANE_FLAGS)
        } catch (e: IllegalArgumentException) {
            promise.reject(ErrorCode.INVALID_ARGUMENT.name, e)
            return
        }
        TankerFuture<Unit>().andThen<String> {
            getTanker(handle).getResourceID(encryptedHeader)
        }.bridge(promise)
    }

    @ReactMethod()
    fun share(handle: TankerHandle, resourceIdsJson: ReadableArray, optionsJson: ReadableMap, promise: Promise) {
        val resourceIds = ArrayList<String>()
        for (i in 0 until resourceIdsJson.size()) {
            resourceIds.add(resourceIdsJson.getString(i)!!)
        }
        val options = SharingOptions(optionsJson)
        getTanker(handle).share(resourceIds.toTypedArray(), options).bridge(promise)
    }

    @ReactMethod()
    fun generateVerificationKey(handle: TankerHandle, promise: Promise) {
        getTanker(handle).generateVerificationKey().bridge(promise)
    }

    @ReactMethod()
    fun getVerificationMethods(handle: TankerHandle, promise: Promise) {
        getTanker(handle).getVerificationMethods().bridge(promise) {
            val jsonMethods = WritableNativeArray()
            for (method in it)
                jsonMethods.pushMap(method.toWritableMap())
            jsonMethods
        }
    }

    @ReactMethod()
    fun createGroup(handle: TankerHandle, userIdsJson: ReadableArray, promise: Promise) {
        val userIds = ArrayList<String>()
        for (i in 0 until userIdsJson.size()) {
            userIds.add(userIdsJson.getString(i)!!)
        }
        getTanker(handle).createGroup(*userIds.toTypedArray()).bridge(promise)
    }

    @ReactMethod()
    fun updateGroupMembers(handle: TankerHandle, groupId: String, args: ReadableMap, promise: Promise) {
        val usersToAddJson = args.getArray("usersToAdd")!!
        val userToAdd = ArrayList<String>()
        for (i in 0 until usersToAddJson.size()) {
            userToAdd.add(usersToAddJson.getString(i)!!)
        }
        getTanker(handle).updateGroupMembers(groupId, userToAdd.toTypedArray()).bridge(promise)
    }

    @ReactMethod()
    fun attachProvisionalIdentity(handle: TankerHandle, identity: String, promise: Promise) {
        getTanker(handle).attachProvisionalIdentity(identity).bridge(promise) { attachResult ->
            val json = WritableNativeMap()
            json.putInt("status", attachResult.status.value)
            attachResult.verificationMethod?.let { method ->
                json.putMap("verificationMethod", method.toWritableMap())
            }
            json
        }
    }

    @ReactMethod()
    fun verifyProvisionalIdentity(handle: TankerHandle, verificationJson: ReadableMap, promise: Promise) {
        val verification = Verification(verificationJson)
        getTanker(handle).verifyProvisionalIdentity(verification).bridge(promise)
    }

    @ReactMethod()
    fun createEncryptionSession(handle: TankerHandle, optionsJson: ReadableMap?, promise: Promise) {
        val options = EncryptionOptions(optionsJson)
        getTanker(handle).createEncryptionSession(options).bridge(promise) {
            storeEncSess(it)
        }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun encryptionSessionDestroy(handle: EncSessHandle): Result<Unit> {
        return syncBridge { destroyEncryptionSession(handle) }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun encryptionSessionGetResourceId(handle: EncSessHandle): Result<String> {
        return syncBridge { getEncryptionSession(handle).getResourceId() }
    }

    @ReactMethod()
    fun encryptionSessionEncryptString(handle: EncSessHandle, clearText: String, promise: Promise) {
        return getEncryptionSession(handle).encrypt(clearText.toByteArray()).bridge(promise) {
            Base64.encodeToString(it, BASE64_SANE_FLAGS)
        }
    }

    @ReactMethod()
    fun encryptionSessionEncryptData(handle: EncSessHandle, clearDataB64: String, promise: Promise) {
        val clearData = try {
            Base64.decode(clearDataB64, BASE64_SANE_FLAGS)
        } catch (e: IllegalArgumentException) {
            promise.reject(ErrorCode.INVALID_ARGUMENT.name, e)
            return
        }
        return getEncryptionSession(handle).encrypt(clearData).bridge(promise) {
            Base64.encodeToString(it, BASE64_SANE_FLAGS)
        }
    }
}
