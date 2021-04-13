import { NativeModules } from 'react-native';
import type { TankerOptions, NativeTanker, Status } from './types';
import type { Result } from './errors';
import type { Verification, VerificationOptions } from './verification';
import type { EncryptionOptions } from './encryptionOptions';

export const VERSION = '0.1.0';

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
    verification: Verification,
    options?: VerificationOptions
  ): Promise<void | string>;
  verifyIdentity(
    instance: NativeTanker,
    verification: Verification,
    options?: VerificationOptions
  ): Promise<void | string>;
  setVerificationMethod(
    instance: NativeTanker,
    verification: Verification,
    options?: VerificationOptions
  ): Promise<void | string>;
  encryptString(
    instance: NativeTanker,
    clearText: string,
    options?: EncryptionOptions
  ): Promise<string>;
  decryptString(instance: NativeTanker, encryptedText: string): Promise<string>;
  encryptData(
    instance: NativeTanker,
    clearData: string,
    options?: EncryptionOptions
  ): Promise<string>;
  decryptData(instance: NativeTanker, encryptedData: string): Promise<string>;
  getResourceId(instance: NativeTanker, encrypted: string): Promise<string>;
};

export const Native: ClientReactNativeType = NativeModules.ClientReactNative;
