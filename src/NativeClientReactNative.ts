import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { AttachResult } from './types';
import type { VerificationMethod } from './verification';

// We need to declare FFI types _in this file_ for React-Native's Codegen
// (Codegen is the Typescript parser + generator for RN FFI bindings, e.g. JNI)
// NOTE: react-native-codegen has importing types on their roadmap, but no ETA
//       Maybe in a few years we can remove these and just import the real types

export type b64string = string;
export type NativeTanker = number;
export type NativeEncryptionSession = number;

type TankerOptions = Object;

export type Status = number;

export type Err = { err: Object };
export type Ok<T> = { ok: T };
// @ts-expect-error
export type Result<T> = Object;

type OIDCAuthorizationCodeVerification = Object;
type Verification = Object;
type VerificationOptions = Object;
type EncryptionOptions = Object;
type SharingOptions = Object;

// NOTE: This has to be named "Spec" to make Codegen happy
export interface Spec extends TurboModule {
  create(options: TankerOptions, version: string): Result<NativeTanker>;

  prehashPassword(password: string): Promise<string>;

  getNativeVersion(): string;

  getStatus(instance: NativeTanker): Result<Status>;

  start(instance: NativeTanker, identity: string): Promise<Status>;

  stop(instance: NativeTanker): Promise<void>;

  createOidcNonce(instance: NativeTanker): Promise<string>;

  setOidcTestNonce(instance: NativeTanker, nonce: string): Promise<void>;

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
  ): Promise<b64string>;

  decryptString(
    instance: NativeTanker,
    encryptedText: b64string
  ): Promise<string>;

  encryptData(
    instance: NativeTanker,
    clearData: b64string,
    options?: EncryptionOptions
  ): Promise<b64string>;

  decryptData(
    instance: NativeTanker,
    encryptedData: b64string
  ): Promise<b64string>;

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
    args: { usersToAdd?: Array<string>; usersToRemove?: Array<string> }
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
  ): Promise<b64string>;

  encryptionSessionEncryptData(
    instance: NativeEncryptionSession,
    clearData: b64string
  ): Promise<b64string>;

  authenticateWithIDP(
    instance: NativeTanker,
    providerID: string,
    subjectCookie: string
  ): Promise<OIDCAuthorizationCodeVerification>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ClientReactNative');
