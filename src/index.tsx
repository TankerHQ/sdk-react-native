import { NativeModules } from 'react-native';

type ClientReactNativeType = {
  multiply(a: number, b: number): Promise<number>;
};

const { ClientReactNative } = NativeModules;

export default ClientReactNative as ClientReactNativeType;
