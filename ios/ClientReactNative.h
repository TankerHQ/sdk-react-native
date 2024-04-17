#import <React/RCTEventEmitter.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNClientReactNativeSpec.h"

@interface ClientReactNative : RCTEventEmitter <NativeClientReactNativeSpec>

#else // Old arch

#import <React/RCTBridgeModule.h>

@interface ClientReactNative : RCTEventEmitter <RCTBridgeModule>
#endif

@end
