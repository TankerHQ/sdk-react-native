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



@end
