
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNClientReactNativeSpec.h"

@interface ClientReactNative : NSObject <NativeClientReactNativeSpec>
#else
#import <React/RCTBridgeModule.h>

@interface ClientReactNative : NSObject <RCTBridgeModule>
#endif

@end
