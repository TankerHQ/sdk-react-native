#import "ClientReactNative.h"
#import <Tanker/TKRTanker.h>

@interface ClientReactNative(Private)

@property (readonly, nonnull) NSDictionary<NSNumber*, TKRTanker*>* tankerInstanceMap;
@property (readonly, nonnull) NSDictionary<NSNumber*, TKREncryptionSession*>* encryptionSessionMap;

- (void) initInstanceMap;
- (void) initEncryptionSessionMap;
- (nonnull NSNumber*) insertTankerInstanceInMap:(nonnull TKRTanker*)instance;
- (void) removeTankerInstanceInMap:(nonnull NSNumber*)handle;
- (nonnull NSNumber*) insertEncryptionSessionInMap:(nonnull TKREncryptionSession*)session;
- (void) removeEncryptionSessionInMap:(nonnull NSNumber*)handle;

@end
