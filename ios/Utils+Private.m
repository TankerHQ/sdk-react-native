#import "Utils+Private.h"

TKRTankerOptions* _Nonnull dictToTankerOptions(NSDictionary<NSString*, id>* _Nonnull optionsDict)
{
  TKRTankerOptions* opts = [TKRTankerOptions options];
  NSString* url = optionsDict[@"url"];
  NSString* writablePath = optionsDict[@"writablePath"];
  NSString* sdkType = optionsDict[@"sdkType"];
  
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
  if (sdkType)
    opts.sdkType = sdkType;
  return opts;
}

TKRVerificationOptions* _Nonnull dictToTankerVerificationOptions(NSDictionary<NSString*, id>* _Nullable optionsDict)
{
  TKRVerificationOptions* ret = [TKRVerificationOptions options];
   if (!optionsDict)
     return ret;
  NSNumber* withSessionToken = optionsDict[@"withSessionToken"];

  if (withSessionToken)
    ret.withSessionToken = withSessionToken.boolValue;
  return ret;
}

TKRVerification* _Nonnull dictToTankerVerification(NSDictionary<NSString*, id>* _Nonnull verificationDict)
{
  NSString* email = verificationDict[@"email"];
  NSString* passphrase = verificationDict[@"passphrase"];
  NSString* verificationKey = verificationDict[@"verificationKey"];
  NSString* oidcIdToken = verificationDict[@"oidcIdToken"];
  NSString* phoneNumber = verificationDict[@"phoneNumber"];
  
  NSString* code = verificationDict[@"verificationCode"];

  if (email)
    return [TKRVerification verificationFromEmail:email verificationCode:code];
  if (passphrase)
    return [TKRVerification verificationFromPassphrase:passphrase];
  if (verificationKey)
    return [TKRVerification verificationFromVerificationKey:[TKRVerificationKey verificationKeyFromValue:verificationKey]];
  if (oidcIdToken)
    return [TKRVerification verificationFromOIDCIDToken:oidcIdToken];
  if (phoneNumber)
    return [TKRVerification verificationFromPhoneNumber:phoneNumber verificationCode:code];
  NSError* err;
  NSData* data = [NSJSONSerialization dataWithJSONObject:verificationDict options:NSJSONWritingPrettyPrinted error:&err];
  NSString* json = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  [NSException raise:NSInvalidArgumentException format:@"Invalid verification object: %@", json];
  return nil;
}

TKREncryptionOptions* _Nonnull dictToTankerEncryptionOptions(NSDictionary<NSString*, id>* _Nullable optionsDict)
{
  TKREncryptionOptions* ret = [TKREncryptionOptions options];
   if (!optionsDict)
     return ret;
  NSArray<NSString*>* shareWithUsers = optionsDict[@"shareWithUsers"];
  NSArray<NSString*>* shareWithGroups = optionsDict[@"shareWithGroups"];
  NSNumber* shareWithSelf = optionsDict[@"shareWithSelf"];
  
  if (shareWithUsers)
    ret.shareWithUsers = shareWithUsers;
  if (shareWithGroups)
    ret.shareWithGroups = shareWithGroups;
  if (shareWithSelf)
    ret.shareWithSelf = shareWithSelf.boolValue;
  return ret;
}

TKRSharingOptions* _Nonnull dictToTankerSharingOptions(NSDictionary<NSString*, id>* _Nullable optionsDict)
{
  TKRSharingOptions* ret = [TKRSharingOptions options];
   if (!optionsDict)
     return ret;
  NSArray<NSString*>* shareWithUsers = optionsDict[@"shareWithUsers"];
  NSArray<NSString*>* shareWithGroups = optionsDict[@"shareWithGroups"];
  
  if (shareWithUsers)
    ret.shareWithUsers = shareWithUsers;
  if (shareWithGroups)
    ret.shareWithGroups = shareWithGroups;
  return ret;
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
  reject(errorCodeToString(err.code), err.localizedDescription, err);
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

NSDictionary<NSString*, id>* verificationMethodToJson(TKRVerificationMethod* method, NSError* _Nullable* _Nonnull err)
{
  NSMutableDictionary<NSString*, id> * field = [NSMutableDictionary dictionary];
  switch (method.type) {
    case TKRVerificationMethodTypeEmail:
      field[@"type"] = @"email";
      field[@"email"] = method.email;
      break;
    case TKRVerificationMethodTypeOIDCIDToken:
      field[@"type"] = @"oidcIdToken";
      break;
    case TKRVerificationMethodTypePassphrase:
      field[@"type"] = @"passphrase";
      break;
    case TKRVerificationMethodTypeVerificationKey:
      field[@"type"] = @"verificationKey";
      break;
    case TKRVerificationMethodTypePhoneNumber:
      field[@"type"] = @"phoneNumber";
      field[@"phoneNumber"] = method.phoneNumber;
      break;
    default:
      *err = [NSError errorWithDomain:TKRErrorDomain code:TKRErrorInternalError userInfo:@{
        NSLocalizedDescriptionKey : [NSString stringWithFormat:@"Unknown verification method type: %d", (int)method.type]
      }];
  }
  return field;
}

NSArray<NSDictionary<NSString*, id> *>* verificationMethodsToJson(NSArray<TKRVerificationMethod*> *methods, NSError* _Nullable * _Nonnull err)
{
  *err = nil;
  
  NSMutableArray<NSDictionary<NSString*, id> *>* ret = [NSMutableArray array];
 
  for (int i = 0; i < methods.count; ++i)
  {
    NSDictionary<NSString*, id>* field = verificationMethodToJson(methods[i], err);
    if (*err != nil)
      return nil;
    [ret addObject:field];
  }
  return ret;
}
