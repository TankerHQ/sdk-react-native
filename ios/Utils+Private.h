#import "Tanker/TKRTanker.h"
#import "Tanker/TKRTankerOptions.h"
#import "Tanker/TKRVerificationOptions.h"
#import "Tanker/TKRError.h"

#import <React/RCTBridgeModule.h>

TKRTankerOptions* _Nonnull dictToTankerOptions(NSDictionary<NSString*, id>* _Nonnull optionsDict);
NSDictionary* _Nonnull invalidHandleError(NSNumber* _Nonnull handle);
NSString* _Nonnull errorCodeToString(TKRError err);
void rejectInvalidHandle(RCTPromiseRejectBlock _Nonnull reject, NSNumber* _Nonnull handle);
void rejectInvalidVerificationDict(RCTPromiseRejectBlock _Nonnull reject);
void rejectWithError(RCTPromiseRejectBlock _Nonnull reject, NSError* _Nonnull err);
