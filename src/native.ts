import { NativeModules } from 'react-native';
import type { TankerOptions, NativeTanker, Status } from './types';

type ClientReactNativeType = {
  create(options: TankerOptions): NativeTanker;
  getVersion(): string;
  prehashPassword(password: string): Promise<string>;
  getStatus(instance: NativeTanker): Status;
  getDeviceId(instance: NativeTanker): string;
  start(instance: NativeTanker, identity: String): Promise<Status>;
  stop(instance: NativeTanker): Promise<void>;
};

export const Native: ClientReactNativeType = NativeModules.ClientReactNative;
