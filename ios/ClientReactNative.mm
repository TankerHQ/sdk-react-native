#import "ClientReactNative+Private.h"
#import "Utils+Private.h"

#import "Tanker/TKRTanker.h"
#import "Tanker/TKRLogEntry.h"

@implementation ClientReactNative
{
    bool hasListeners;
}

RCT_EXPORT_MODULE()

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeClientReactNativeSpecJSI>(params);
}
#endif

- (instancetype) init
{
    if (self = [super init])
    {
        [self initInstanceMap];
        [self initEncryptionSessionMap];
        [TKRTanker connectLogHandler:^(TKRLogEntry* _Nonnull entry) {
            if (self->hasListeners) {
                NSDictionary* body = @{@"category": entry.category, @"level": @(entry.level), @"file": entry.file, @"line": @(entry.line), @"message": entry.message};
                [self sendEventWithName:@"tankerLogHandlerEvent" body:body];
            }
        }];
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

-(void) startObserving {
    hasListeners = YES;
}

-(void) stopObserving {
    hasListeners = NO;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getNativeVersion)
{
    return [TKRTanker nativeVersionString];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(create, id, createWithOptions:(nonnull NSDictionary<NSString*, id>*)optionsDict version:(nonnull NSString*)version)
{
    NSError* err;

    TKRTankerOptions* opts = dictToTankerOptions(optionsDict);
    TKRTanker* tanker = [TKRTanker tankerWithOptions:opts err:&err];
    if (err)
        return @{@"err" : @{@"code": errorCodeToString((TKRError)err.code), @"message": err.localizedDescription}};
    return @{@"ok": [self insertTankerInstanceInMap:tanker]};
}

RCT_REMAP_METHOD(start, startWithTankerHandle:(nonnull NSNumber*)handle identity:(nonnull NSString*)identity resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    [tanker startWithIdentity:identity completionHandler:^(TKRStatus status, NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        resolve([NSNumber numberWithInt:(int)status]);
    }];
}

RCT_REMAP_METHOD(stop, stopWithTankerHandle:(nonnull NSNumber*)handle resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
    if (!tanker)
        return rejectInvalidHandle(reject, handle);
    [tanker stopWithCompletionHandler:^(NSError * _Nullable err) {
        if (err != nil)
            return rejectWithError(reject, err);
        [self removeTankerInstanceInMap:handle];
        resolve(nil);
    }];
}

RCT_REMAP_BLOCKING_SYNCHRONOUS_METHOD(getStatus, id, getStatusWithTankerHandle:(nonnull NSNumber*)handle)
{
    TKRTanker* tanker = [self.tankerInstanceMap objectForKey:handle];
    if (!tanker)
        return invalidHandleError(handle);
    return @{@"ok": [NSNumber numberWithInt:(int)tanker.status]};
}

@end
