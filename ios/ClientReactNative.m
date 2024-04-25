#import "ClientReactNative+Private.h"
#import "Utils+Private.h"

#import "Tanker/TKRTanker.h"
#import "Tanker/TKRLogEntry.h"
#import "Tanker/TKRAttachResult.h"

#import "tanker_client_react_native-Swift.h"

@implementation ClientReactNative
{
    bool hasListeners;
}

RCT_EXPORT_MODULE()

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

RCT_EXPORT_METHOD(prehashPassword:(nonnull NSString*)password resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSError* err;
        NSString* hashed = [TKRTanker prehashPassword:password error:&err];
        if (err)
            return rejectWithError(reject, err);
        resolve(hashed);
    });
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(create, id, createWithOptions:(nonnull NSDictionary<NSString*, id>*)optionsDict version:(nonnull NSString*)version)
{
    NSError* err;

    TKRTankerOptions* opts = dictToTankerOptions(optionsDict);
    TKRTanker* tanker = [TKRTanker tankerWithOptions:opts err:&err];
    if (err)
        return @{@"err" : @{@"code": errorCodeToString((TKRError)err.code), @"message": err.localizedDescription}};
    return @{@"ok": [self insertTankerInstanceInMap:tanker]};
}

RCT_REMAP_METHOD(start, startWithTankerHandle:(nonnull NSNumber*)handle identity:(nonnull NSString*)identity resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    [tanker startWithIdentity:identity completionHandler:^(TKRStatus status, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve([NSNumber numberWithInt:(int)status]);
    }];
}

RCT_REMAP_METHOD(stop, stopWithTankerHandle:(nonnull NSNumber*)handle resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    [tanker stopWithCompletionHandler:^(NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        [self removeTankerInstanceInMap:handle];
        resolve(nil);
    }];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getStatus, id, getStatusWithTankerHandle:(nonnull NSNumber*)handle)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
    if (!tanker)
        return invalidHandleError(handle);
    return @{@"ok": [NSNumber numberWithInt:(int)tanker.status]};
}

RCT_REMAP_METHOD(registerIdentity,
        registerIdentityWithTankerHandle:(nonnull NSNumber*)handle
        verification:(nonnull NSDictionary<NSString*, id>*)verificationDict
        options:(nullable NSDictionary<NSString*, id>*)optionsDict
        resolver:(RCTPromiseResolveBlock)resolve
        rejecter:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
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
        verifyIdentityWithTankerHandle:(nonnull NSNumber*)handle
        verification:(nonnull NSDictionary<NSString*, id>*)verificationDict
        options:(nullable NSDictionary<NSString*, id>*)optionsDict
        resolver:(RCTPromiseResolveBlock)resolve
        rejecter:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
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
        setVerificationMethodWithTankerHandle:(nonnull NSNumber*)handle
        verification:(nonnull NSDictionary<NSString*, id>*)verificationDict
        options:(nullable NSDictionary<NSString*, id>*)optionsDict
        resolver:(RCTPromiseResolveBlock)resolve
        rejecter:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
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
        generateVerificationKeyWithTankerHandle:(nonnull NSNumber*)handle
        resolver:(RCTPromiseResolveBlock)resolve
        rejecter:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    [tanker generateVerificationKeyWithCompletionHandler:^(TKRVerificationKey * _Nullable key, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve(key.value);
    }];
}

RCT_REMAP_METHOD(getVerificationMethods,
        getVerificationMethodsWithTankerHandle:(nonnull NSNumber*)handle
        resolver:(RCTPromiseResolveBlock)resolve
        rejecter:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
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

RCT_REMAP_METHOD(createOidcNonce, createOidcNonceWithTankerHandle:(nonnull NSNumber*)handle resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);

    [tanker createOidcNonceWithCompletionHandler:^(NSString *nonce, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve(nonce);
    }];
}

RCT_REMAP_METHOD(setOidcTestNonce, setOidcTestNonceWithTankerHandle:(nonnull NSNumber*)handle nonce:(nonnull NSString*)nonce resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);

    [tanker setOidcTestNonce:nonce completionHandler:^(NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve(nil);
    }];
}

RCT_REMAP_METHOD(authenticateWithIDP, authenticateWithIDPWithTankerHandle:(nonnull NSNumber*)handle
        providerID:(nonnull NSString*)providerID
        subjectCookie:(nonnull NSString*)subjectCookie
        resolver:(RCTPromiseResolveBlock)resolve
        rejecter:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
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
        attachProvisionalIdentityWithTankerHandle:(nonnull NSNumber*)handle
        identity:(nonnull NSString*)identity
        resolver:(RCTPromiseResolveBlock)resolve
        rejecter:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
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
        verifyProvisionalIdentityWithTankerHandle:(nonnull NSNumber*)handle
        verification:(nonnull NSDictionary<NSString*, id>*)verificationDict
        resolver:(RCTPromiseResolveBlock)resolve
        rejecter:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
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

@end
