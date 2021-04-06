#import "ClientReactNative.h"

#import "Tanker/TKRTanker.h"

@implementation ClientReactNative

RCT_EXPORT_MODULE()

RCT_REMAP_METHOD(multiply, multiplyWithA:(nonnull NSNumber*)a withB:(nonnull NSNumber*)b
                     resolver:(RCTPromiseResolveBlock)resolve
                     rejecter:(RCTPromiseRejectBlock)reject)
{
  NSNumber *result = @([a floatValue] * [b floatValue]);
  NSLog(@"Tanker version: %@", [TKRTanker versionString]);
  resolve(@[result]);
}


@end
