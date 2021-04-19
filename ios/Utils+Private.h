#import "Tanker/TKRTanker.h"
#import "Tanker/TKRTankerOptions.h"
#import "Tanker/TKRVerificationOptions.h"
#import "Tanker/TKRError.h"

TKRTankerOptions* _Nonnull dictToTankerOptions(NSDictionary<NSString*, id>* _Nonnull optionsDict);
TKRVerificationOptions* _Nonnull dictToTankerVerificationOptions(NSDictionary<NSString*, id>* _Nullable optionsDict);
TKRVerification* _Nonnull dictToTankerVerification(NSDictionary<NSString*, id>* _Nonnull verificationDict);
TKREncryptionOptions* _Nonnull dictToTankerEncryptionOptions(NSDictionary<NSString*, id>* _Nullable optionsDict);
TKRSharingOptions* _Nonnull dictToTankerSharingOptions(NSDictionary<NSString*, id>* _Nullable optionsDict);
NSDictionary* _Nonnull invalidHandleError(NSNumber* _Nonnull handle);
NSString* _Nonnull errorCodeToString(TKRError err);
NSDictionary<NSString*, id>* _Nullable verificationMethodToJson(TKRVerificationMethod* _Nonnull method, NSError* _Nullable* _Nonnull err);
NSArray<NSDictionary<NSString*, id> *>* _Nullable verificationMethodsToJson(NSArray<TKRVerificationMethod*> * _Nonnull methods, NSError* _Nullable * _Nonnull err);
