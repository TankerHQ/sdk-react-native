#import "ClientReactNative+Private.h"

#import "Tanker/TKRTanker.h"
#import "Tanker/TKRError.h"
#import "Tanker/TKRAttachResult.h"
#import "Tanker/TKREncryptionSession.h"
#import "Utils+Private.h"

@implementation ClientReactNative

RCT_EXPORT_MODULE()

- (instancetype) init
{
  if (self = [super init])
  {
    [self initInstanceMap];
    [self initEncryptionSessionMap];
  }
  return self;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getNativeVersion)
{
  return [TKRTanker nativeVersionString];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(create, id, createWithOptions:(nonnull NSDictionary<NSString*, id>*)optionsDict version:(nonnull NSString*)version)
{
  @try
  {
    TKRTankerOptions* opts = dictToTankerOptions(optionsDict);
    TKRTanker* tanker = [TKRTanker tankerWithOptions:opts];
    return @{@"ok": [self insertTankerInstanceInMap:tanker]};
  }
  @catch (NSException* e)
  {
    return @{@"err" : @{@"code": @"INVALID_ARGUMENT", @"message": e.reason}};
  }
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getStatus, id, getStatusWithTankerHandle:(nonnull NSNumber*)handle)
{
  TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
  if (!tanker)
    return invalidHandleError(handle);
  return @{@"ok": [NSNumber numberWithInt:(int)tanker.status]};
}


RCT_REMAP_METHOD(getDeviceId, getDeviceIdWithTankerHandle:(nonnull NSNumber*)handle resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
  if (!tanker)
    return rejectInvalidHandle(reject, handle);
  [tanker deviceIDWithCompletionHandler:^(NSString* deviceId, NSError* err) {
    if (err != nil)
      return rejectWithError(reject, err);
    resolve(deviceId);
  }];
}

RCT_EXPORT_METHOD(prehashPassword:(nonnull NSString*)password resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    @try
    {
      resolve([TKRTanker prehashPassword:password]);
    } @catch (NSException * e)
    {
      reject(errorCodeToString(TKRErrorInvalidArgument), e.reason, nil);
    }
  });
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

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(destroy, id, destroyWithTankerHandle:(nonnull NSNumber*)handle)
{
  if ([self.tankerInstanceMap objectForKey:handle] != nil)
  {
    [self removeTankerInstanceInMap:handle];
    return @{@"ok": @""};
  }
  return invalidHandleError(handle);
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
  TKRVerification* tankerVerification = dictToTankerVerification(verificationDict);
  TKRVerificationOptions* tankerOptions = dictToTankerVerificationOptions(optionsDict);
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
  TKRVerification* tankerVerification = dictToTankerVerification(verificationDict);
  TKRVerificationOptions* tankerOptions = dictToTankerVerificationOptions(optionsDict);
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
  TKRVerification* tankerVerification = dictToTankerVerification(verificationDict);
  TKRVerificationOptions* tankerOptions = dictToTankerVerificationOptions(optionsDict);
  [tanker setVerificationMethod:tankerVerification options:tankerOptions completionHandler:^(NSString* _Nullable sessionToken, NSError * _Nullable err) {
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
      NSArray<NSDictionary<NSString*, id>*>* jsonMethods = verificationMethodsToJson(methods, &err);
      if (err != nil)
        return rejectWithError(reject, err);
      resolve(jsonMethods);
  }];
}

RCT_REMAP_METHOD(createGroup,
                 createGroupWithTankerHandle:(nonnull NSNumber*)handle publicIdentities:(nonnull NSArray<NSString*>*)identities
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
  if (!tanker)
    return rejectInvalidHandle(reject, handle);
  [tanker createGroupWithIdentities:identities completionHandler:^(NSString * _Nullable groupID, NSError * _Nullable err) {
    if (err != nil)
      return rejectWithError(reject, err);
    resolve(groupID);
  }];
}

RCT_REMAP_METHOD(encryptString,
                 encryptStringWithTankerHandle:(nonnull NSNumber*)handle
                 clearText:(nonnull NSString*)clearText
                 options:(nullable NSDictionary<NSString*, id>*)optionsDict
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
  if (!tanker)
    return rejectInvalidHandle(reject, handle);

  TKREncryptionOptions* options = dictToTankerEncryptionOptions(optionsDict);
  [tanker encryptString:clearText options:options completionHandler:^(NSData * _Nullable encryptedData, NSError * _Nullable err) {
    if (err != nil)
      return rejectWithError(reject, err);
    resolve([encryptedData base64EncodedStringWithOptions:0]);
  }];
}

RCT_REMAP_METHOD(decryptString,
                 decryptStringWithTankerHandle:(nonnull NSNumber*)handle
                 b64EncryptedText:(nonnull NSString*)b64EncryptedText
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
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
                 encryptDataWithTankerHandle:(nonnull NSNumber*)handle
                 b64ClearData:(nonnull NSString*)b64ClearData
                 options:(nullable NSDictionary<NSString*, id>*)optionsDict
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
  if (!tanker)
    return rejectInvalidHandle(reject, handle);
  NSData* clearData = [[NSData alloc] initWithBase64EncodedString:b64ClearData options:0];
  if (!clearData)
    return reject(errorCodeToString(TKRErrorInvalidArgument), @"Invalid base64 clear data", nil);
  TKREncryptionOptions* options = dictToTankerEncryptionOptions(optionsDict);
  [tanker encryptData:clearData options:options completionHandler:^(NSData * _Nullable encryptedData, NSError * _Nullable err) {
    if (err != nil)
      return rejectWithError(reject, err);
    resolve([encryptedData base64EncodedStringWithOptions:0]);
  }];
}

RCT_REMAP_METHOD(decryptData,
                 decryptDataWithTankerHandle:(nonnull NSNumber*)handle
                 b64EncryptedData:(nonnull NSString*)b64EncryptedData
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
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

RCT_REMAP_METHOD(getResourceId,
                 getResourceIdWithTankerHandle:(nonnull NSNumber*)handle
                 b64EncryptedData:(nonnull NSString*)b64EncryptedData
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
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

RCT_REMAP_METHOD(share,
                 shareWithTankerHandle:(nonnull NSNumber*)handle
                 resourceIds:(nonnull NSArray<NSString*>*)resourceIds
                 options:(nonnull NSDictionary<NSString*, id>*)optionsDict
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
  if (!tanker)
    return rejectInvalidHandle(reject, handle);
  TKRSharingOptions* options = dictToTankerSharingOptions(optionsDict);
  [tanker shareResourceIDs:resourceIds options:options completionHandler:^(NSError * _Nullable err) {
    if (err != nil)
      return rejectWithError(reject, err);
    resolve(nil);
  }];
}

RCT_REMAP_METHOD(updateGroupMembers,
                 updateGroupMembersWithTankerHandle:(nonnull NSNumber*)handle
                 groupId:(nonnull NSString*)groupId
                 options:(nonnull NSDictionary<NSString*, id>*)optionsDict
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
  if (!tanker)
    return rejectInvalidHandle(reject, handle);
  NSArray<NSString*>* usersToAdd = optionsDict[@"usersToAdd"];
  if (!usersToAdd || usersToAdd.count == 0)
    return reject(errorCodeToString(TKRErrorInvalidArgument), @"usersToAdd cannot be nil nor empty", nil);
  [tanker updateMembersOfGroup:groupId usersToAdd:usersToAdd completionHandler:^(NSError * _Nullable err) {
    if (err != nil)
      return rejectWithError(reject, err);
    resolve(nil);
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
      NSDictionary<NSString*, id>* jsonMethod = verificationMethodToJson(result.method, &err);
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
    TKRVerification* verification = dictToTankerVerification(verificationDict);
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

RCT_REMAP_METHOD(createEncryptionSession,
                 createEncryptionSessionWithTankerHandle:(nonnull NSNumber*)handle
                 options:(nullable NSDictionary<NSString*, id>*)optionsDict
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
  if (!tanker)
    return rejectInvalidHandle(reject, handle);
  TKREncryptionOptions* options = dictToTankerEncryptionOptions(optionsDict);
  [tanker createEncryptionSessionWithCompletionHandler:^(TKREncryptionSession * _Nullable session, NSError * _Nullable err) {
    if (err != nil)
      return rejectWithError(reject, err);
    resolve([self insertEncryptionSessionInMap:session]);
  } encryptionOptions:options];
}

RCT_REMAP_METHOD(encryptionSessionEncryptString,
                 encryptStringWithEncryptionSessionHandle:(nonnull NSNumber*)handle
                 clearText:(nonnull NSString*)text
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  TKREncryptionSession* session = [self.encryptionSessionMap objectForKey:handle];
  if (!session)
    return rejectInvalidHandle(reject, handle);
  [session encryptString:text completionHandler:^(NSData * _Nullable encryptedData, NSError * _Nullable err) {
    if (err != nil)
      return rejectWithError(reject, err);
    resolve([encryptedData base64EncodedStringWithOptions:0]);
  }];
}

RCT_REMAP_METHOD(encryptionSessionEncryptData,
                 encryptDataWithEncryptionSessionHandle:(nonnull NSNumber*)handle
                 b64ClearData:(nonnull NSString*)b64ClearData
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  TKREncryptionSession* session = [self.encryptionSessionMap objectForKey:handle];
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

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(encryptionSessionGetResourceId, id, getResourceIdWithEncryptionSessionHandle:(nonnull NSNumber*)handle)
{
  TKREncryptionSession* session = [self.encryptionSessionMap objectForKey:handle];
  if (!session)
    return invalidHandleError(handle);
  return @{@"ok": session.resourceID};
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(encryptionSessionDestroy, id, destroyEncryptionSessionHandle:(nonnull NSNumber*)handle)
{
  if (![self.encryptionSessionMap objectForKey:handle])
    return invalidHandleError(handle);
  [self removeEncryptionSessionInMap:handle];
  return @{@"ok": @""};
}

@end
