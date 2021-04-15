import { Native, VERSION } from './native';
import { bridgeSyncResult, bridgeAsyncExceptions } from './errors';
import type {
  Status,
  TankerOptions,
  NativeTanker,
  AttachResult,
} from './types';
import {
  Verification,
  assertVerification,
  VerificationOptions,
  VerificationMethod,
} from './verification';
import type { EncryptionOptions } from './encryptionOptions';
import { extractSharingOptions, SharingOptions } from './sharingOptions';
import { extractEncryptionOptions } from './encryptionOptions';
import { EncryptionSession } from './encryptionSessionWrapper';

export class Tanker {
  private readonly instance: NativeTanker;

  constructor(options: TankerOptions) {
    this.instance = bridgeSyncResult(() => Native.create(options, VERSION));
  }

  get version(): string {
    return VERSION;
  }

  get nativeVersion(): string {
    return Native.getNativeVersion();
  }

  get status(): Status {
    return bridgeSyncResult(() => Native.getStatus(this.instance));
  }

  get deviceId(): string {
    return bridgeSyncResult(() => Native.getDeviceId(this.instance));
  }

  start(identity: String): Promise<Status> {
    return bridgeAsyncExceptions(Native.start(this.instance, identity));
  }

  stop(): Promise<void> {
    return bridgeAsyncExceptions(Native.stop(this.instance));
  }

  registerIdentity(
    verification: Verification,
    options?: VerificationOptions
  ): Promise<void | string> {
    assertVerification(verification);
    return bridgeAsyncExceptions(
      Native.registerIdentity(this.instance, verification, options)
    );
  }

  verifyIdentity(
    verification: Verification,
    options?: VerificationOptions
  ): Promise<void | string> {
    return bridgeAsyncExceptions(
      Native.verifyIdentity(this.instance, verification, options)
    );
  }

  setVerificationMethod(
    verification: Verification,
    options?: VerificationOptions
  ): Promise<void | string> {
    return bridgeAsyncExceptions(
      Native.setVerificationMethod(this.instance, verification, options)
    );
  }

  encrypt(clearText: string, options?: EncryptionOptions): Promise<string> {
    return bridgeAsyncExceptions(
      Native.encryptString(
        this.instance,
        clearText,
        extractEncryptionOptions(options)
      )
    );
  }

  decrypt(encryptedText: string): Promise<string> {
    return bridgeAsyncExceptions(
      Native.decryptString(this.instance, encryptedText)
    );
  }

  encryptData(clearData: string, options?: EncryptionOptions): Promise<string> {
    return bridgeAsyncExceptions(
      Native.encryptData(
        this.instance,
        clearData,
        extractEncryptionOptions(options)
      )
    );
  }

  decryptData(encryptedData: string): Promise<string> {
    return bridgeAsyncExceptions(
      Native.decryptData(this.instance, encryptedData)
    );
  }

  getResourceId(encrypted: string): Promise<string> {
    // We know the header is either at the start or the end, but the slicing of both ends is too complicated,
    // so we just pass the whole encrypted buffer in base64
    return bridgeAsyncExceptions(
      Native.getResourceId(this.instance, encrypted)
    );
  }

  share(resourceIds: Array<string>, options: SharingOptions): Promise<string> {
    return bridgeAsyncExceptions(
      Native.share(this.instance, resourceIds, extractSharingOptions(options))
    );
  }

  generateVerificationKey(): Promise<string> {
    return bridgeAsyncExceptions(Native.generateVerificationKey(this.instance));
  }

  getVerificationMethods(): Promise<Array<VerificationMethod>> {
    return bridgeAsyncExceptions(Native.getVerificationMethods(this.instance));
  }

  createGroup(userIds: Array<string>): Promise<string> {
    return bridgeAsyncExceptions(Native.createGroup(this.instance, userIds));
  }

  updateGroupMembers(
    groupId: string,
    args: { usersToAdd: Array<string> }
  ): Promise<void> {
    return bridgeAsyncExceptions(
      Native.updateGroupMembers(this.instance, groupId, args)
    );
  }

  attachProvisionalIdentity(identity: string): Promise<AttachResult> {
    return bridgeAsyncExceptions(
      Native.attachProvisionalIdentity(this.instance, identity)
    );
  }

  verifyProvisionalIdentity(verification: Verification): Promise<void> {
    assertVerification(verification);
    return bridgeAsyncExceptions(
      Native.verifyProvisionalIdentity(this.instance, verification)
    );
  }

  async createEncryptionSession(
    options?: EncryptionOptions
  ): Promise<EncryptionSession> {
    const instance = await bridgeAsyncExceptions(
      Native.createEncryptionSession(this.instance, options)
    );
    return new EncryptionSession(instance);
  }
}
