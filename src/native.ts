import { NativeModules } from 'react-native';
import type {
  TankerOptions,
  NativeTanker,
  Status,
  AttachResult,
  NativeEncryptionSession,
} from './types';
import type { Result } from './errors';
import type {
  Verification,
  VerificationMethod,
  VerificationOptions,
} from './verification';
import type { EncryptionOptions } from './encryptionOptions';
import type { SharingOptions } from './sharingOptions';

export const VERSION = '0.1.0';

type ClientReactNativeType = {
  create(options: TankerOptions, version: String): Result<NativeTanker>;
  destroy(instance: NativeTanker): Result<void>;
  prehashPassword(password: string): Promise<string>;
  getNativeVersion(): string;
  getStatus(instance: NativeTanker): Result<Status>;
  getDeviceId(instance: NativeTanker): Promise<string>;
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
  share(
    instance: NativeTanker,
    resourceIds: Array<string>,
    options: SharingOptions
  ): Promise<string>;
  generateVerificationKey(instance: NativeTanker): Promise<string>;
  getVerificationMethods(
    instance: NativeTanker
  ): Promise<Array<VerificationMethod>>;
  createGroup(instance: NativeTanker, userIds: Array<string>): Promise<string>;
  updateGroupMembers(
    instance: NativeTanker,
    groupId: string,
    args: { usersToAdd: Array<string> }
  ): Promise<void>;
  attachProvisionalIdentity(
    instance: NativeTanker,
    identity: string
  ): Promise<AttachResult>;
  verifyProvisionalIdentity(
    instance: NativeTanker,
    verification: Verification
  ): Promise<void>;
  createEncryptionSession(
    instance: NativeTanker,
    options?: EncryptionOptions
  ): Promise<NativeEncryptionSession>;
  encryptionSessionDestroy(instance: NativeEncryptionSession): Result<void>;
  encryptionSessionGetResourceId(
    instance: NativeEncryptionSession
  ): Result<string>;
  encryptionSessionEncryptString(
    instance: NativeEncryptionSession,
    clearText: string
  ): Promise<string>;
  encryptionSessionEncryptData(
    instance: NativeEncryptionSession,
    clearData: string
  ): Promise<string>;
};

export const Native: ClientReactNativeType = NativeModules.ClientReactNative;
