import { Native, VERSION } from './native';
import { bridgeSyncResult, bridgeAsyncExceptions } from './errors';
import type {
  Status,
  TankerOptions,
  NativeTanker,
  AttachResult,
  b64string,
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
  private readonly options: TankerOptions;
  private instance: NativeTanker | null;

  constructor(options: TankerOptions) {
    this.options = Object.assign({}, options);
    this.instance = null;
    this.getInstance();
  }

  private getInstance(): NativeTanker {
    if (!this.instance) {
      this.instance = bridgeSyncResult(() =>
        Native.create(this.options, VERSION)
      );
    }
    return this.instance;
  }

  get version(): string {
    return VERSION;
  }

  get nativeVersion(): string {
    return Native.getNativeVersion();
  }

  get status(): Status {
    return bridgeSyncResult(() => Native.getStatus(this.getInstance()));
  }

  deviceId(): Promise<string> {
    return bridgeAsyncExceptions(Native.getDeviceId(this.getInstance()));
  }

  start(identity: String): Promise<Status> {
    return bridgeAsyncExceptions(Native.start(this.getInstance(), identity));
  }

  async stop(): Promise<void> {
    const instance = this.getInstance(); // "You need to be logged in to log out. Please log in to log out."
    const result = await bridgeAsyncExceptions(Native.stop(instance));
    bridgeSyncResult(() => Native.destroy(instance));
    this.instance = null;
    return result;
  }

  registerIdentity(
    verification: Verification,
    options?: VerificationOptions
  ): Promise<void | string> {
    assertVerification(verification);
    return bridgeAsyncExceptions(
      Native.registerIdentity(this.getInstance(), verification, options)
    );
  }

  verifyIdentity(
    verification: Verification,
    options?: VerificationOptions
  ): Promise<void | string> {
    return bridgeAsyncExceptions(
      Native.verifyIdentity(this.getInstance(), verification, options)
    );
  }

  setVerificationMethod(
    verification: Verification,
    options?: VerificationOptions
  ): Promise<void | string> {
    return bridgeAsyncExceptions(
      Native.setVerificationMethod(this.getInstance(), verification, options)
    );
  }

  encrypt(clearText: string, options?: EncryptionOptions): Promise<b64string> {
    return bridgeAsyncExceptions(
      Native.encryptString(
        this.getInstance(),
        clearText,
        extractEncryptionOptions(options)
      )
    );
  }

  decrypt(encryptedText: b64string): Promise<string> {
    return bridgeAsyncExceptions(
      Native.decryptString(this.getInstance(), encryptedText)
    );
  }

  encryptData(
    clearData: b64string,
    options?: EncryptionOptions
  ): Promise<b64string> {
    return bridgeAsyncExceptions(
      Native.encryptData(
        this.getInstance(),
        clearData,
        extractEncryptionOptions(options)
      )
    );
  }

  decryptData(encryptedData: b64string): Promise<b64string> {
    return bridgeAsyncExceptions(
      Native.decryptData(this.getInstance(), encryptedData)
    );
  }

  getResourceId(encrypted: string): Promise<string> {
    // We know the header is either at the start or the end, but the slicing of both ends is too complicated,
    // so we just pass the whole encrypted buffer in base64
    return bridgeAsyncExceptions(
      Native.getResourceId(this.getInstance(), encrypted)
    );
  }

  share(resourceIds: Array<string>, options: SharingOptions): Promise<string> {
    return bridgeAsyncExceptions(
      Native.share(
        this.getInstance(),
        resourceIds,
        extractSharingOptions(options)
      )
    );
  }

  generateVerificationKey(): Promise<string> {
    return bridgeAsyncExceptions(
      Native.generateVerificationKey(this.getInstance())
    );
  }

  getVerificationMethods(): Promise<Array<VerificationMethod>> {
    return bridgeAsyncExceptions(
      Native.getVerificationMethods(this.getInstance())
    );
  }

  createGroup(userIds: Array<string>): Promise<string> {
    return bridgeAsyncExceptions(
      Native.createGroup(this.getInstance(), userIds)
    );
  }

  updateGroupMembers(
    groupId: string,
    args: { usersToAdd: Array<string> }
  ): Promise<void> {
    return bridgeAsyncExceptions(
      Native.updateGroupMembers(this.getInstance(), groupId, args)
    );
  }

  attachProvisionalIdentity(identity: string): Promise<AttachResult> {
    return bridgeAsyncExceptions(
      Native.attachProvisionalIdentity(this.getInstance(), identity)
    );
  }

  verifyProvisionalIdentity(verification: Verification): Promise<void> {
    assertVerification(verification);
    return bridgeAsyncExceptions(
      Native.verifyProvisionalIdentity(this.getInstance(), verification)
    );
  }

  async createEncryptionSession(
    options?: EncryptionOptions
  ): Promise<EncryptionSession> {
    const instance = await bridgeAsyncExceptions(
      Native.createEncryptionSession(this.getInstance(), options)
    );
    return new EncryptionSession(instance);
  }
}
