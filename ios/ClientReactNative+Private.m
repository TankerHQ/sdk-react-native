#import "ClientReactNative+Private.h"

#import <objc/runtime.h>
#import <stdlib.h>

@implementation ClientReactNative (Private)

@dynamic tankerInstanceMap;

- (void) initInstanceMap
{
  assert(objc_getAssociatedObject(self, @selector(tankerInstanceMap)) == nil);

  NSMutableDictionary<NSNumber*, TKRTanker*>* m = [NSMutableDictionary dictionary];
  objc_setAssociatedObject(self, @selector(tankerInstanceMap), m, OBJC_ASSOCIATION_RETAIN);
}

- (nonnull NSNumber*) insertTankerInstanceInMap:(nonnull TKRTanker *)instance
{
  NSMutableDictionary<NSNumber*, TKRTanker*>* m = objc_getAssociatedObject(self, @selector(tankerInstanceMap));
  
  while (true)
  {
    NSNumber* handle = [NSNumber numberWithUnsignedInt:arc4random()];
    if ([m objectForKey:handle] == nil)
    {
      m[handle] = instance;
      return handle;
    }
  }
}

- (nonnull NSDictionary<NSNumber*, TKRTanker*>*)tankerInstanceMap
{
  return objc_getAssociatedObject(self, @selector(tankerInstanceMap));
}

@end
