#import "ClientReactNative+Private.h"
#import "Utils+Private.h"

#import <objc/runtime.h>
#import <stdlib.h>

@implementation ClientReactNative (Private)

@dynamic tankerInstanceMap;
@dynamic encryptionSessionMap;

- (void) initInstanceMap
{
  assert(objc_getAssociatedObject(self, @selector(tankerInstanceMap)) == nil);

  NSMutableDictionary<NSNumber*, TKRTanker*>* m = [NSMutableDictionary dictionary];
  objc_setAssociatedObject(self, @selector(tankerInstanceMap), m, OBJC_ASSOCIATION_RETAIN);
}

- (void) initEncryptionSessionMap
{
  assert(objc_getAssociatedObject(self, @selector(encryptionSessionMap)) == nil);

  NSMutableDictionary<NSNumber*, TKREncryptionSession*>* m = [NSMutableDictionary dictionary];
  objc_setAssociatedObject(self, @selector(encryptionSessionMap), m, OBJC_ASSOCIATION_RETAIN);
}

- (nonnull NSNumber*) insertTankerInstanceInMap:(nonnull TKRTanker *)instance
{
  NSMutableDictionary<NSNumber*, TKRTanker*>* m = objc_getAssociatedObject(self, @selector(tankerInstanceMap));

  while (true)
  {
    NSNumber* handle = @(arc4random());
    if ([m objectForKey:handle] == nil)
    {
      m[handle] = instance;
      return handle;
    }
  }
}

- (nonnull NSNumber*) insertEncryptionSessionInMap:(nonnull TKREncryptionSession *)session
{
  NSMutableDictionary<NSNumber*, TKREncryptionSession*>* m = objc_getAssociatedObject(self, @selector(encryptionSessionMap));

  while (true)
  {
    NSNumber* handle = @(arc4random());
    if ([m objectForKey:handle] == nil)
    {
      m[handle] = session;
      return handle;
    }
  }
}

- (nonnull NSDictionary<NSNumber*, TKRTanker*>*)tankerInstanceMap
{
  return objc_getAssociatedObject(self, @selector(tankerInstanceMap));
}

- (nonnull NSDictionary<NSNumber*, TKREncryptionSession*>*)encryptionSessionMap
{
  return objc_getAssociatedObject(self, @selector(encryptionSessionMap));
}

- (void) removeTankerInstanceInMap:(unsigned)handle
{
  NSMutableDictionary<NSNumber*, TKRTanker*>* m = objc_getAssociatedObject(self, @selector(tankerInstanceMap));
  [m removeObjectForKey:@(handle)];
}

- (void) removeEncryptionSessionInMap:(unsigned)handle
{
  NSMutableDictionary<NSNumber*, TKREncryptionSession*>* m = objc_getAssociatedObject(self, @selector(encryptionSessionMap));
  [m removeObjectForKey:@(handle)];
}

@end
