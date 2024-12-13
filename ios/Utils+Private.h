#import "Tanker/TKRTanker.h"
#import "Tanker/TKRTankerOptions.h"
#import "Tanker/TKRError.h"

#import <React/RCTBridgeModule.h>

#ifdef __cplusplus
extern "C" {
#endif

TKRTankerOptions* _Nonnull dictToTankerOptions(NSDictionary<NSString*, id>* _Nonnull optionsDict);
NSDictionary* _Nonnull invalidHandleError(unsigned handle);
NSString* _Nonnull errorCodeToString(TKRError err);
void rejectInvalidHandle(RCTPromiseRejectBlock _Nonnull reject, unsigned handle);
void rejectInvalidVerificationDict(RCTPromiseRejectBlock _Nonnull reject);
void rejectWithInternalError(RCTPromiseRejectBlock _Nonnull reject, NSString *_Nonnull msg);
void rejectWithError(RCTPromiseRejectBlock _Nonnull reject, NSError* _Nonnull err);

#ifdef __cplusplus
};
#endif
