import { NativeModules } from 'react-native';
import type { TankerOptions, NativeTanker, Status } from './types';
import type { Result } from './errors';
import type { Verification } from './verification';

export const VERSION = '2.12.0-alpha1';

type ClientReactNativeType = {
  create(options: TankerOptions, version: String): Result<NativeTanker>;
  prehashPassword(password: string): Promise<string>;
  getNativeVersion(): string;
  getStatus(instance: NativeTanker): Result<Status>;
  getDeviceId(instance: NativeTanker): Result<string>;
  start(instance: NativeTanker, identity: String): Promise<Status>;
  stop(instance: NativeTanker): Promise<void>;
  registerIdentity(
    instance: NativeTanker,
    verification: Verification
  ): Promise<void>;
  verifyIdentity(
    instance: NativeTanker,
    verification: Verification
  ): Promise<void>;
  setVerificationMethod(
    instance: NativeTanker,
    verification: Verification
  ): Promise<void>;
};

export const Native: ClientReactNativeType = NativeModules.ClientReactNative;
