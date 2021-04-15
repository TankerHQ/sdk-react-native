#import "ClientReactNative.h"
#import <Tanker/TKRTanker.h>

typedef NSNumber* TankerHandle;

@interface ClientReactNative(Private)

@property (readonly, nonnull) NSDictionary<TankerHandle, TKRTanker*>* tankerInstanceMap;

- (void) initInstanceMap;
- (nonnull TankerHandle) insertTankerInstanceInMap:(nonnull TKRTanker*)instance;

@end
