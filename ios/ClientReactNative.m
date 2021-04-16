#import "ClientReactNative+Private.h"

#import "Tanker/TKRTanker.h"
#import "Tanker/TKRError.h"

static TKRTankerOptions* _Nonnull dictToTankerOptions(NSDictionary<NSString*, id>* _Nonnull optionsDict)
{
  TKRTankerOptions* opts = [TKRTankerOptions options];
  NSString* url = optionsDict[@"url"];
  NSString* writablePath = optionsDict[@"writablePath"];
  //NSString* sdkType = optionsDict[@"sdkType"];
  
  opts.appID = optionsDict[@"appId"];
  if (url)
    opts.url = url;
  if (writablePath)
    opts.writablePath = writablePath;
  else
  {
    NSURL* path = [[[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] lastObject];
    opts.writablePath = [path absoluteString];
  }
  //if (sdkType)
   // opts.type = sdkType; TODO add type in sdk-ios options??
  return opts;
}

static TKRVerificationOptions* _Nonnull dictToTankerVerificationOptions(NSDictionary<NSString*, id>* _Nullable optionsDict)
{
  TKRVerificationOptions* ret = [TKRVerificationOptions options];
   if (!optionsDict)
     return ret;
  NSNumber* withSessionToken = optionsDict[@"withSessionToken"];

  if (withSessionToken)
    ret.withSessionToken = withSessionToken.boolValue;
  return ret;
}

static TKRVerification* _Nonnull dictToTankerVerification(NSDictionary<NSString*, id>* _Nonnull verificationDict)
{
  NSString* email = verificationDict[@"email"];
  NSString* passphrase = verificationDict[@"passphrase"];
  NSString* verificationKey = verificationDict[@"verificationKey"];
  NSString* oidcIdToken = verificationDict[@"oidcIdToken"];
  
  if (email)
    return [TKRVerification verificationFromEmail:email verificationCode:verificationDict[@"verificationCode"]];
  if (passphrase)
    return [TKRVerification verificationFromPassphrase:passphrase];
  if (verificationKey)
    return [TKRVerification verificationFromVerificationKey:[TKRVerificationKey verificationKeyFromValue:verificationKey]];
  if (oidcIdToken)
    return [TKRVerification verificationFromOIDCIDToken:oidcIdToken];
  NSError* err;
  NSData* data = [NSJSONSerialization dataWithJSONObject:verificationDict options:NSJSONWritingPrettyPrinted error:&err];
  NSString* json = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  [NSException raise:NSInvalidArgumentException format:@"Invalid verification object: %@", json];
  return nil;
}

static NSDictionary* invalidHandleError(NSNumber* _Nonnull handle)
{
  return  @{@"err" : @{@"code": @"INTERNAL_ERROR", @"message": [NSString stringWithFormat:@"invalid handle: %ul", handle.unsignedIntValue]}};
}

static NSString* errorCodeToString(TKRError err)
{
  switch (err)
  {
    case TKRErrorConflict:
      return @"CONFLICT";
    case TKRErrorInternalError:
      return @"INTERNAL_ERROR";
    case TKRErrorInvalidArgument:
      return @"INVALID_ARGUMENT";
    case TKRErrorNetworkError:
      return @"NETWORK_ERROR";
    case TKRErrorPreconditionFailed:
      return @"PRECONDITION_FAILED";
    case TKRErrorOperationCanceled:
      return @"OPERATION_CANCELED";
    case TKRErrorDecryptionFailed:
      return @"DECRYPTION_FAILED";
    case TKRErrorGroupTooBig:
      return @"GROUP_TOO_BIG";
    case TKRErrorInvalidVerification:
      return @"INVALID_VERIFICATION";
    case TKRErrorTooManyAttempts:
      return @"TOO_MANY_ATTEMPTS";
    case TKRErrorExpiredVerification:
      return @"EXPIRED_VERIFICATION";
    case TKRErrorIOError:
      return @"IO_ERROR";
    case TKRErrorDeviceRevoked:
      return @"DEVICE_REVOKED";
    case TKRErrorUpgradeRequired:
      return @"UPGRADE_REQUIRED";
    default:
      return @"UNKNOWN_ERROR";
  }
}

@implementation ClientReactNative

RCT_EXPORT_MODULE()

- (instancetype) init
{
  if (self = [super init])
    [self initInstanceMap];
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
  {
    reject(@"INTERNAL_ERROR", @"Invalid handle", nil);
    return;
  }
  [tanker deviceIDWithCompletionHandler:^(NSString* deviceId, NSError* err) {
    if (err != nil)
      reject(errorCodeToString(err.code), err.localizedDescription, err);
    else
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
      reject(@"INVALID_ARGUMENT", e.reason, nil);
    }
  });
}

RCT_REMAP_METHOD(start, startWithTankerHandle:(nonnull NSNumber*)handle identity:(nonnull NSString*)identity resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
  if (!tanker)
    reject(@"INTERNAL_ERROR", @"Invalid handle", nil);
  else
  {
    [tanker startWithIdentity:identity completionHandler:^(TKRStatus status, NSError * _Nullable err) {
      if (err != nil)
        reject(errorCodeToString(err.code), err.localizedDescription, err);
      else
        resolve([NSNumber numberWithInt:(int)status]);
    }];
  }
}

RCT_REMAP_METHOD(stop, stopWithTankerHandle:(nonnull NSNumber*)handle resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
  if (!tanker)
    reject(@"INTERNAL_ERROR", @"Invalid handle", nil);
  else
  {
    [tanker stopWithCompletionHandler:^(NSError * _Nullable err) {
      if (err != nil)
        reject(errorCodeToString(err.code), err.localizedDescription, err);
      else
      {
        [self removeTankerInstanceInMap:handle];
        resolve(nil);
      }
    }];
  }
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
    reject(@"INTERNAL_ERROR", @"Invalid handle", nil);
  else
  {
    TKRVerification* tankerVerification = dictToTankerVerification(verificationDict);
    TKRVerificationOptions* tankerOptions = dictToTankerVerificationOptions(optionsDict);
    [tanker registerIdentityWithVerification:tankerVerification options:tankerOptions completionHandler:^(NSString * _Nullable sessionToken, NSError * _Nullable err) {
       if (err != nil)
         reject(errorCodeToString(err.code), err.localizedDescription, err);
       else
         resolve(sessionToken);
    }];
  }
}

@end
