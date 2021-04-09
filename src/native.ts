import { NativeModules } from 'react-native';
import type { TankerOptions, NativeTanker, Status } from './types';

export const VERSION = 'dev';

type ClientReactNativeType = {
  create(options: TankerOptions, version: String): NativeTanker;
  prehashPassword(password: string): Promise<string>;
  getNativeVersion(): string;
  getStatus(instance: NativeTanker): Status;
  getDeviceId(instance: NativeTanker): string;
  start(instance: NativeTanker, identity: String): Promise<Status>;
  stop(instance: NativeTanker): Promise<void>;
};

export const Native: ClientReactNativeType = NativeModules.ClientReactNative;
