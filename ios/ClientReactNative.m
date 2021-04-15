#import "ClientReactNative+Private.h"

#import "Tanker/TKRTanker.h"

static TKRTankerOptions* _Nonnull dictToTankerOptions(NSDictionary<NSString*, id>* _Nonnull optionsDict)
{
  TKRTankerOptions* opts = [TKRTankerOptions options];
  NSString* url = optionsDict[@"url"];
  NSString* writablePath = optionsDict[@"writablePath"];
  //NSString* sdkType = optionsDict[@"sdkType"];
  
  opts.appID = optionsDict[@"appId"];
  if (url)
    opts.url = url;
  if (writablePath)
    opts.writablePath = writablePath;
  else
  {
    NSURL* path = [[[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] lastObject];
    opts.writablePath = [path absoluteString];
  }
  //if (sdkType)
   // opts.type = sdkType; TODO add type in sdk-ios options??
  return opts;
}

@implementation ClientReactNative

RCT_EXPORT_MODULE()

- (instancetype) init
{
  if (self = [super init])
    [self initInstanceMap];
  return self;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getNativeVersion)
{
  return [TKRTanker nativeVersionString];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(create, id, createWithOptions:(nonnull NSDictionary<NSString*, id>*)optionsDict version:(nonnull NSString*)version)
{
  @try
  {
    TKRTankerOptions* opts = dictToTankerOptions(optionsDict);
    TKRTanker* tanker = [TKRTanker tankerWithOptions:opts];
    return @{@"ok": [self insertTankerInstanceInMap:tanker]};
  }
  @catch (NSException* e)
  {
    return @{@"err" : @{@"code": @"INVALID_ARGUMENT", @"message": e.reason}};
  }
}
@end
