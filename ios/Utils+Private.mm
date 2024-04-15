#import "Utils+Private.h"

TKRTankerOptions* _Nonnull dictToTankerOptions(NSDictionary<NSString*, id>* _Nonnull optionsDict)
{
  TKRTankerOptions* opts = [TKRTankerOptions options];
  NSString* url = optionsDict[@"url"];
  NSString* persistentPath = optionsDict[@"persistentPath"];
  NSString* cachePath = optionsDict[@"cachePath"];
  NSString* sdkType = optionsDict[@"sdkType"];

  opts.appID = optionsDict[@"appId"];
  if (url)
    opts.url = url;
  if (persistentPath)
    opts.persistentPath = persistentPath;
  else
  {
    NSURL* path = [[[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] lastObject];
    opts.persistentPath = [path absoluteString];
  }
  if (cachePath)
    opts.cachePath = cachePath;
  else
  {
    NSURL* path = [[[NSFileManager defaultManager] URLsForDirectory:NSCachesDirectory inDomains:NSUserDomainMask] lastObject];
    opts.cachePath = [path absoluteString];
  }
  if (sdkType)
    opts.sdkType = sdkType;
  return opts;
}

NSDictionary* invalidHandleError(NSNumber* _Nonnull handle)
{
  return  @{@"err" : @{@"code": errorCodeToString(TKRErrorInternalError), @"message": [NSString stringWithFormat:@"invalid handle: %ul", handle.unsignedIntValue]}};
}

void rejectInvalidHandle(RCTPromiseRejectBlock _Nonnull reject, NSNumber* _Nonnull handle)
{
  reject(errorCodeToString(TKRErrorInternalError), [NSString stringWithFormat:@"invalid handle: %ul", handle.unsignedIntValue], nil);
}

void rejectWithError(RCTPromiseRejectBlock _Nonnull reject, NSError* _Nonnull err)
{
  reject(errorCodeToString((TKRError)err.code), err.localizedDescription, err);
}

NSString* errorCodeToString(TKRError err)
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
    case TKRErrorIdentityAlreadyAttached:
      return @"IDENTITY_ALREADY_ATTACHED";
    default:
      return @"UNKNOWN_ERROR";
  }
}
