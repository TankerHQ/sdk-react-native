import { NativeModules } from 'react-native';
import type { TankerOptions, NativeTanker, Status } from './types';

type ClientReactNativeType = {
  create(options: TankerOptions): NativeTanker;
  getVersion(): string;
  getStatus(instance: NativeTanker): Status;
};

export const Native: ClientReactNativeType = NativeModules.ClientReactNative;
