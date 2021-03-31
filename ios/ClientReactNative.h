#import <React/RCTBridgeModule.h>

@interface ClientReactNative : NSObject <RCTBridgeModule>

-(void) multiplyWithA:(nonnull NSNumber*)a withB:(nonnull NSNumber*)b resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject;

@end
