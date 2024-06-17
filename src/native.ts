import { NativeModules, Platform } from 'react-native';
import type {
  TankerOptions,
  NativeTanker,
  Status,
  AttachResult,
  NativeEncryptionSession,
  b64string,
} from './types';
import type { Result } from './errors';
import type {
  OIDCAuthorizationCodeVerification,
  Verification,
  VerificationMethod,
  VerificationOptions,
} from './verification';
import type { EncryptionOptions } from './encryptionOptions';
import type { SharingOptions } from './sharingOptions';

export const VERSION = '0.1.0';

// This interface definition is used only on the JS side,
// it is not automatically checked against the Android/iOS side
type ClientReactNativeType = {
  create(options: TankerOptions, version: String): Result<NativeTanker>;
  prehashPassword(password: string): Promise<string>;
  getNativeVersion(): string;
  getStatus(instance: NativeTanker): Result<Status>;
  start(instance: NativeTanker, identity: String): Promise<Status>;
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
  getResourceId(instance: NativeTanker, encryptedData: string): Promise<string>;
  share(
    instance: NativeTanker,
    resourceIds: Array<string>,
    options: SharingOptions
  ): Promise<string>;
  generateVerificationKey(instance: NativeTanker): Promise<string>;
  getVerificationMethods(
    instance: NativeTanker
  ): Promise<Array<VerificationMethod>>;
  createGroup(
    instance: NativeTanker,
    publicIdentities: Array<string>
  ): Promise<string>;
  updateGroupMembers(
    instance: NativeTanker,
    groupId: string,
    options: { usersToAdd?: Array<string>; usersToRemove?: Array<string> }
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
};

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const ClientReactNativeModule = isTurboModuleEnabled
  ? require('./NativeClientReactNative').default
  : NativeModules.ClientReactNative;

const LINKING_ERROR =
  `The package '@tanker/client-react-native' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

export const Native: ClientReactNativeType = ClientReactNativeModule
  ? ClientReactNativeModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );
