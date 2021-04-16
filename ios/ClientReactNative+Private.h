#import "ClientReactNative.h"
#import <Tanker/TKRTanker.h>

@interface ClientReactNative(Private)

@property (readonly, nonnull) NSDictionary<NSNumber*, TKRTanker*>* tankerInstanceMap;

- (void) initInstanceMap;
- (nonnull NSNumber*) insertTankerInstanceInMap:(nonnull TKRTanker*)instance;
- (void) removeTankerInstanceInMap:(nonnull NSNumber*)handle;

@end
