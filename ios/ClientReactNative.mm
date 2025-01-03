#import "ClientReactNative+Private.h"
#import "Utils+Private.h"

#import "Tanker/TKRTanker.h"
#import "Tanker/TKRLogEntry.h"
#import "Tanker/TKRAttachResult.h"
#import "Tanker/TKREncryptionSession.h"

// Depending on whether we use a local pod in a folder or a published package,
// the include path to the auto-generated Swift header will change.
// There are only two possibilities, and we need to support both.
#if __has_include(<tanker_client_react_native/tanker_client_react_native-Swift.h>)
#import <tanker_client_react_native/tanker_client_react_native-Swift.h>
#else
#import <tanker_client_react_native-Swift.h>
#endif

@implementation ClientReactNative
{
    bool hasListeners;
}

RCT_EXPORT_MODULE()

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeClientReactNativeSpecJSI>(params);
}
#endif

- (instancetype) init
{
    if (self = [super init])
    {
        [self initInstanceMap];
        [self initEncryptionSessionMap];
        [TKRTanker connectLogHandler:^(TKRLogEntry* _Nonnull entry) {
            if (self->hasListeners) {
                NSDictionary* body = @{@"category": entry.category, @"level": @(entry.level), @"file": entry.file, @"line": @(entry.line), @"message": entry.message};
                [self sendEventWithName:@"tankerLogHandlerEvent" body:body];
            }
        }];
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

-(NSArray<NSString *> *)supportedEvents
{
    return @[@"tankerLogHandlerEvent"];
}

-(void) startObserving {
    hasListeners = YES;
}

-(void) stopObserving {
    hasListeners = NO;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getNativeVersion)
{
    return [TKRTanker nativeVersionString];
}

RCT_EXPORT_METHOD(prehashPassword:(nonnull NSString*)password resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSError* err;
        NSString* hashed = [TKRTanker prehashPassword:password error:&err];
        if (err)
            return rejectWithError(reject, err);
        resolve(hashed);
    });
}

RCT_EXPORT_METHOD(prehashAndEncryptPassword:(nonnull NSString*)password
                                  publicKey:(nonnull NSString*)publicKey
                                    resolve:(RCTPromiseResolveBlock)resolve
                                     reject:(RCTPromiseRejectBlock)reject
)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSError* err;
        NSString* hashed = [TKRTanker prehashAndEncryptPassword:password publicKey:publicKey error:&err];
        if (err)
            return rejectWithError(reject, err);
        resolve(hashed);
  });
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(create, id, create:(nonnull NSDictionary<NSString*, id>*)optionsDict version:(nonnull NSString*)version)
{
    NSError* err;

    TKRTankerOptions* opts = dictToTankerOptions(optionsDict);
    TKRTanker* tanker = [TKRTanker tankerWithOptions:opts error:&err];
    if (err)
        return @{@"err" : @{@"code": errorCodeToString((TKRError)err.code), @"message": err.localizedDescription}};
    return @{@"ok": [self insertTankerInstanceInMap:tanker]};
}

RCT_REMAP_METHOD(start, start:(double)handle identity:(nonnull NSString*)identity resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    [tanker startWithIdentity:identity completionHandler:^(TKRStatus status, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve([NSNumber numberWithInt:(int)status]);
    }];
}

RCT_REMAP_METHOD(stop, stop:(double)handle resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    [tanker stopWithCompletionHandler:^(NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        [self removeTankerInstanceInMap:handle];
        resolve(nil);
    }];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getStatus, id, getStatus:(double)handle)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return invalidHandleError(handle);
    return @{@"ok": [NSNumber numberWithInt:(int)tanker.status]};
}

RCT_REMAP_METHOD(registerIdentity,
        registerIdentity:(double)handle
        verification:(nonnull NSDictionary<NSString*, id>*)verificationDict
        options:(nullable NSDictionary<NSString*, id>*)optionsDict
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    TKRVerificationOptions* tankerOptions = [Utils dictToTankerVerificationOptionsWithDict:optionsDict];
    TKRVerification* tankerVerification = [Utils dictToTankerVerificationWithDict:verificationDict];
    if (!tankerVerification)
      return rejectInvalidVerificationDict(reject);
    [tanker registerIdentityWithVerification:tankerVerification options:tankerOptions completionHandler:^(NSString * _Nullable sessionToken, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve(sessionToken);
    }];
}

RCT_REMAP_METHOD(verifyIdentity,
        verifyIdentity:(double)handle
        verification:(nonnull NSDictionary<NSString*, id>*)verificationDict
        options:(nullable NSDictionary<NSString*, id>*)optionsDict
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    TKRVerificationOptions* tankerOptions = [Utils dictToTankerVerificationOptionsWithDict:optionsDict];
    TKRVerification* tankerVerification = [Utils dictToTankerVerificationWithDict:verificationDict];
    if (!tankerVerification)
      return rejectInvalidVerificationDict(reject);
    [tanker verifyIdentityWithVerification:tankerVerification options:tankerOptions completionHandler:^(NSString * _Nullable sessionToken, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve(sessionToken);
    }];
}

RCT_REMAP_METHOD(setVerificationMethod,
        setVerificationMethod:(double)handle
        verification:(nonnull NSDictionary<NSString*, id>*)verificationDict
        options:(nullable NSDictionary<NSString*, id>*)optionsDict
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    TKRVerificationOptions* tankerOptions = [Utils dictToTankerVerificationOptionsWithDict:optionsDict];
    TKRVerification* tankerVerification = [Utils dictToTankerVerificationWithDict:verificationDict];
    if (!tankerVerification)
        return rejectInvalidVerificationDict(reject);
      [tanker setVerificationMethodWithVerification:tankerVerification options:tankerOptions completionHandler:^(NSString* _Nullable sessionToken, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve(sessionToken);
    }];
}

RCT_REMAP_METHOD(generateVerificationKey,
        generateVerificationKey:(double)handle
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    [tanker generateVerificationKeyWithCompletionHandler:^(TKRVerificationKey * _Nullable key, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve(key.value);
    }];
}

RCT_REMAP_METHOD(getVerificationMethods,
        getVerificationMethods:(double)handle
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    [tanker verificationMethodsWithCompletionHandler:^(NSArray<TKRVerificationMethod *> * _Nullable methods, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        NSArray<NSDictionary<NSString*, id>*>* jsonMethods = [Utils verificationMethodsToJsonWithMethods:methods error:&err];
        if (err != nil)
            return rejectWithError(reject, err);
        resolve(jsonMethods);
    }];
}

RCT_REMAP_METHOD(createOidcNonce, createOidcNonce:(double)handle resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);

    [tanker createOidcNonceWithCompletionHandler:^(NSString *nonce, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve(nonce);
    }];
}

RCT_REMAP_METHOD(setOidcTestNonce, setOidcTestNonce:(double)handle nonce:(nonnull NSString*)nonce resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);

    [tanker setOidcTestNonce:nonce completionHandler:^(NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve(nil);
    }];
}

RCT_REMAP_METHOD(authenticateWithIDP, authenticateWithIDP:(double)handle
        providerID:(nonnull NSString*)providerID
        subjectCookie:(nonnull NSString*)subjectCookie
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);

    [tanker authenticateWithIDP:providerID cookie:subjectCookie completionHandler:^(TKRVerification* _Nullable verif, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        NSDictionary<NSString*, id>* verifDict = [Utils oidcAuthCodeDictFromVerif:verif];
        if (verifDict == nil)
            return rejectWithInternalError(reject, @"authenticateWithIDP received invalid verification result, this should never happen");
        resolve(verifDict);
    }];
}

RCT_REMAP_METHOD(attachProvisionalIdentity,
        attachProvisionalIdentity:(double)handle
        identity:(nonnull NSString*)identity
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    [tanker attachProvisionalIdentity:identity completionHandler:^(TKRAttachResult * _Nullable result, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        NSMutableDictionary<NSString*, id>* ret = [NSMutableDictionary dictionary];
        ret[@"status"] = [NSNumber numberWithInt:(int)result.status];
        if (result.method)
        {
            NSDictionary<NSString*, id>* jsonMethod = [Utils verificationMethodToJsonWithMethod:result.method error:&err];
            if (err != nil)
                return rejectWithError(reject, err);
            ret[@"verificationMethod"] = jsonMethod;
        }
        resolve(ret);
    }];
}

RCT_REMAP_METHOD(verifyProvisionalIdentity,
        verifyProvisionalIdentity:(double)handle
        verification:(nonnull NSDictionary<NSString*, id>*)verificationDict
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    @try
    {
        TKRVerification* verification = [Utils dictToTankerVerificationWithDict:verificationDict];
        if (!verificationDict)
            return rejectInvalidVerificationDict(reject);
        [tanker verifyProvisionalIdentityWithVerification:verification completionHandler:^(NSError * _Nullable err) {
            if (err != nil)
                return rejectWithError(reject, err);
            resolve(nil);
        }];
    }
    @catch (NSException* e)
    {
        reject(errorCodeToString(TKRErrorInvalidArgument), e.reason, nil);
    }
}

RCT_REMAP_METHOD(encryptString,
        encryptString:(double)handle
        clearText:(nonnull NSString*)clearText
        options:(nullable NSDictionary<NSString*, id>*)optionsDict
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);

    NSError* err = nil;
    TKREncryptionOptions* options = [Utils dictToTankerEncryptionOptionsWithDict:optionsDict error:&err];
    if (err != nil)
        return rejectWithError(reject, err);
    [tanker encryptString:clearText options:options completionHandler:^(NSData * _Nullable encryptedData, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve([encryptedData base64EncodedStringWithOptions:0]);
    }];
}

RCT_REMAP_METHOD(decryptString,
        decryptString:(double)handle
        encryptedText:(nonnull NSString*)b64EncryptedText
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    NSData* encryptedData = [[NSData alloc] initWithBase64EncodedString:b64EncryptedText options:0];
    if (!encryptedData)
        return reject(errorCodeToString(TKRErrorInvalidArgument), @"Invalid base64 encrypted data", nil);
    [tanker decryptStringFromData:encryptedData completionHandler:^(NSString * _Nullable decryptedString, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve(decryptedString);
    }];
}

RCT_REMAP_METHOD(encryptData,
        encryptData:(double)handle
        clearData:(nonnull NSString*)b64ClearData
        options:(nullable NSDictionary<NSString*, id>*)optionsDict
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    NSData* clearData = [[NSData alloc] initWithBase64EncodedString:b64ClearData options:0];
    if (!clearData)
        return reject(errorCodeToString(TKRErrorInvalidArgument), @"Invalid base64 clear data", nil);
    NSError* err = nil;
    TKREncryptionOptions* options = [Utils dictToTankerEncryptionOptionsWithDict:optionsDict error:&err];
    if (err != nil)
        return rejectWithError(reject, err);
    [tanker encryptData:clearData options:options completionHandler:^(NSData * _Nullable encryptedData, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve([encryptedData base64EncodedStringWithOptions:0]);
    }];
}

RCT_REMAP_METHOD(decryptData,
        decryptData:(double)handle
        encryptedData:(nonnull NSString*)b64EncryptedData
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    NSData* encryptedData = [[NSData alloc] initWithBase64EncodedString:b64EncryptedData options:0];
    if (!encryptedData)
        return reject(errorCodeToString(TKRErrorInvalidArgument), @"Invalid base64 encrypted data", nil);
    [tanker decryptData:encryptedData completionHandler:^(NSData * _Nullable decryptedData, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve([decryptedData base64EncodedStringWithOptions:0]);
    }];
}

RCT_REMAP_METHOD(share,
        share:(double)handle
        resourceIds:(nonnull NSArray<NSString*>*)resourceIds
        options:(nonnull NSDictionary<NSString*, id>*)optionsDict
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    TKRSharingOptions* options = [Utils dictToTankerSharingOptionsWithDict:optionsDict];
    [tanker shareResourceIDs:resourceIds options:options completionHandler:^(NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve(nil);
    }];
}

RCT_REMAP_METHOD(getResourceId,
        getResourceId:(double)handle
        encryptedData:(nonnull NSString*)b64EncryptedData
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    NSData* encryptedData = [[NSData alloc] initWithBase64EncodedString:b64EncryptedData options:0];
    if (!encryptedData)
        return reject(errorCodeToString(TKRErrorInvalidArgument), @"Invalid base64 encrypted data", nil);
    NSError* err;
    NSString* resourceId = [tanker resourceIDOfEncryptedData:encryptedData error:&err];
    if (err != nil)
        return rejectWithError(reject, err);
    resolve(resourceId);
}

RCT_REMAP_METHOD(createGroup,
        createGroup:(double)handle
        publicIdentities:(nonnull NSArray<NSString*>*)identities
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    [tanker createGroupWithIdentities:identities completionHandler:^(NSString * _Nullable groupID, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve(groupID);
    }];
}

RCT_REMAP_METHOD(updateGroupMembers,
        updateGroupMembers:(double)handle
        groupId:(nonnull NSString*)groupId
        options:(nonnull NSDictionary<NSString*, id>*)optionsDict
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    NSArray<NSString*>* usersToAdd = optionsDict[@"usersToAdd"];
    if (!usersToAdd)
        usersToAdd = @[];
    NSArray<NSString*>* usersToRemove = optionsDict[@"usersToRemove"];
    if (!usersToRemove)
        usersToRemove = @[];
    [tanker updateMembersOfGroup:groupId usersToAdd:usersToAdd usersToRemove:usersToRemove completionHandler:^(NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve(nil);
    }];
}

RCT_REMAP_METHOD(createEncryptionSession,
        createEncryptionSession:(double)handle
        options:(nullable NSDictionary<NSString*, id>*)optionsDict
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    NSError* err = nil;
    TKREncryptionOptions* options = [Utils dictToTankerEncryptionOptionsWithDict:optionsDict error:&err];
    if (err != nil)
        return rejectWithError(reject, err);
    [tanker createEncryptionSessionWithCompletionHandler:^(TKREncryptionSession * _Nullable session, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve([self insertEncryptionSessionInMap:session]);
    } encryptionOptions:options];
}

RCT_REMAP_METHOD(encryptionSessionEncryptString,
        encryptionSessionEncryptString:(double)handle
        clearText:(nonnull NSString*)text
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKREncryptionSession* session = [self.encryptionSessionMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!session)
        return rejectInvalidHandle(reject, handle);
    [session encryptString:text completionHandler:^(NSData * _Nullable encryptedData, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve([encryptedData base64EncodedStringWithOptions:0]);
    }];
}

RCT_REMAP_METHOD(encryptionSessionEncryptData,
        encryptionSessionEncryptData:(double)handle
        clearData:(nonnull NSString*)b64ClearData
        resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject)
{
    TKREncryptionSession* session = [self.encryptionSessionMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!session)
        return rejectInvalidHandle(reject, handle);
    NSData* clearData = [[NSData alloc] initWithBase64EncodedString:b64ClearData options:0];
    if (!clearData)
        return reject(errorCodeToString(TKRErrorInvalidArgument), @"Invalid base64 clear data", nil);
    [session encryptData:clearData completionHandler:^(NSData * _Nullable encryptedData, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve([encryptedData base64EncodedStringWithOptions:0]);
    }];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(encryptionSessionGetResourceId, id, encryptionSessionGetResourceId:(double)handle)
{
    TKREncryptionSession* session = [self.encryptionSessionMap objectForKey:[NSNumber numberWithUnsignedInt:handle]];
    if (!session)
        return invalidHandleError(handle);
    return @{@"ok": session.resourceID};
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(encryptionSessionDestroy, id, encryptionSessionDestroy:(double)handle)
{
    if (![self.encryptionSessionMap objectForKey:[NSNumber numberWithUnsignedInt:handle]])
        return invalidHandleError(handle);
    [self removeEncryptionSessionInMap:handle];
    return @{@"ok": @""};
}

@end
