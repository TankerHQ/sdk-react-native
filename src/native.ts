import { NativeModules } from 'react-native';

export type NativeTanker = number;

export type TankerOptions = {
  appId: string;
  url?: string;
  writablePath?: string;
};

type ClientReactNativeType = {
  create(options: TankerOptions): NativeTanker;
  getVersion(): string;
  getAppId(instance: NativeTanker): string;
};

export const Native: ClientReactNativeType = NativeModules.ClientReactNative;
