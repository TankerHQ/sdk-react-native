import { InvalidArgument } from '@tanker/errors';
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
  assertVerificationOptions,
} from './verification';
import type { EncryptionOptions } from './encryptionOptions';
import { extractSharingOptions, SharingOptions } from './sharingOptions';
import { extractEncryptionOptions } from './encryptionOptions';
import { EncryptionSession } from './encryptionSessionWrapper';
import { assertNotEmptyString, statuses } from './types';

export class Tanker {
  private readonly options: TankerOptions;
  private instance: NativeTanker | null;

  static version = VERSION;
  static statuses = statuses;

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

  get nativeVersion(): string {
    return Native.getNativeVersion();
  }

  get status(): Status {
    return bridgeSyncResult(() => Native.getStatus(this.getInstance()));
  }

  async start(identity: String): Promise<Status> {
    assertNotEmptyString(identity, 'identity');
    return bridgeAsyncExceptions(Native.start(this.getInstance(), identity));
  }

  async stop(): Promise<void> {
    const instance = this.getInstance();
    this.instance = null;
    return bridgeAsyncExceptions(Native.stop(instance));
  }

  async createOidcNonce(): Promise<string> {
    return bridgeAsyncExceptions(Native.createOidcNonce(this.getInstance()));
  }

  async setOidcTestNonce(nonce: string): Promise<void> {
    return bridgeAsyncExceptions(Native.setOidcTestNonce(this.getInstance(), nonce));
  }

  async registerIdentity(
    verification: Verification,
    options?: VerificationOptions
  ): Promise<void | string> {
    assertVerification(verification);
    assertVerificationOptions(options);
    return bridgeAsyncExceptions(
      Native.registerIdentity(this.getInstance(), verification, options)
    );
  }

  async verifyIdentity(
    verification: Verification,
    options?: VerificationOptions
  ): Promise<void | string> {
    assertVerification(verification);
    assertVerificationOptions(options);
    return bridgeAsyncExceptions(
      Native.verifyIdentity(this.getInstance(), verification, options)
    );
  }

  async setVerificationMethod(
    verification: Verification,
    options?: VerificationOptions
  ): Promise<void | string> {
    assertVerification(verification);
    assertVerificationOptions(options);
    return bridgeAsyncExceptions(
      Native.setVerificationMethod(this.getInstance(), verification, options)
    );
  }

  async encrypt(
    clearText: string,
    options?: EncryptionOptions
  ): Promise<b64string> {
    // noinspection SuspiciousTypeOfGuard
    if (typeof clearText !== 'string') {
      throw new InvalidArgument('clearText', `clearText should be a string`);
    }
    return bridgeAsyncExceptions(
      Native.encryptString(
        this.getInstance(),
        clearText,
        extractEncryptionOptions(options)
      )
    );
  }

  async decrypt(encryptedText: b64string): Promise<string> {
    // noinspection SuspiciousTypeOfGuard
    if (typeof encryptedText !== 'string') {
      throw new InvalidArgument(
        'encryptedText',
        `encryptedText should be a string`
      );
    }
    return bridgeAsyncExceptions(
      Native.decryptString(this.getInstance(), encryptedText)
    );
  }

  async encryptData(
    clearData: b64string,
    options?: EncryptionOptions
  ): Promise<b64string> {
    // noinspection SuspiciousTypeOfGuard
    if (typeof clearData !== 'string') {
      throw new InvalidArgument('clearData', `clearData should be a string`);
    }
    return bridgeAsyncExceptions(
      Native.encryptData(
        this.getInstance(),
        clearData,
        extractEncryptionOptions(options)
      )
    );
  }

  async decryptData(encryptedData: b64string): Promise<b64string> {
    // noinspection SuspiciousTypeOfGuard
    if (typeof encryptedData !== 'string') {
      throw new InvalidArgument(
        'encryptedData',
        `encryptedData should be a string`
      );
    }
    return bridgeAsyncExceptions(
      Native.decryptData(this.getInstance(), encryptedData)
    );
  }

  async getResourceId(encrypted: string): Promise<string> {
    assertNotEmptyString(encrypted, 'encrypted');
    // We know the header is either at the start or the end, but the slicing of both ends is too complicated,
    // so we just pass the whole encrypted buffer in base64
    return bridgeAsyncExceptions(
      Native.getResourceId(this.getInstance(), encrypted)
    );
  }

  async share(
    resourceIds: Array<string>,
    options: SharingOptions
  ): Promise<string> {
    resourceIds.forEach((e) => assertNotEmptyString(e, `resourceIds`));
    return bridgeAsyncExceptions(
      Native.share(
        this.getInstance(),
        resourceIds,
        extractSharingOptions(options)
      )
    );
  }

  async generateVerificationKey(): Promise<string> {
    return bridgeAsyncExceptions(
      Native.generateVerificationKey(this.getInstance())
    );
  }

  async getVerificationMethods(): Promise<Array<VerificationMethod>> {
    return bridgeAsyncExceptions(
      Native.getVerificationMethods(this.getInstance())
    );
  }

  async createGroup(userIds: Array<string>): Promise<string> {
    userIds.forEach((e) => assertNotEmptyString(e, `userIds`));
    return bridgeAsyncExceptions(
      Native.createGroup(this.getInstance(), userIds)
    );
  }

  async updateGroupMembers(
    groupId: string,
    args: { usersToAdd?: Array<string>; usersToRemove?: Array<string> }
  ): Promise<void> {
    assertNotEmptyString(groupId, 'groupId');
    const { usersToAdd, usersToRemove } = args;
    if (usersToAdd && !(usersToAdd instanceof Array))
      throw new InvalidArgument('usersToAdd', 'Array<string>', usersToAdd);
    if (usersToRemove && !(usersToRemove instanceof Array))
      throw new InvalidArgument(
        'usersToRemove',
        'Array<string>',
        usersToRemove
      );
    usersToAdd?.forEach((user) => assertNotEmptyString(user, 'usersToAdd'));
    usersToRemove?.forEach((user) =>
      assertNotEmptyString(user, 'usersToRemove')
    );

    return bridgeAsyncExceptions(
      Native.updateGroupMembers(this.getInstance(), groupId, args)
    );
  }

  async attachProvisionalIdentity(identity: string): Promise<AttachResult> {
    assertNotEmptyString(identity, 'identity');
    return bridgeAsyncExceptions(
      Native.attachProvisionalIdentity(this.getInstance(), identity)
    );
  }

  async verifyProvisionalIdentity(verification: Verification): Promise<void> {
    assertVerification(verification);
    return bridgeAsyncExceptions(
      Native.verifyProvisionalIdentity(this.getInstance(), verification)
    );
  }

  async createEncryptionSession(
    options?: EncryptionOptions
  ): Promise<EncryptionSession> {
    const instance = await bridgeAsyncExceptions(
      Native.createEncryptionSession(
        this.getInstance(),
        extractEncryptionOptions(options)
      )
    );
    return new EncryptionSession(instance);
  }
}
