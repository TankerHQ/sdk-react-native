import { Native, VERSION } from './native';
import { bridgeSyncResult, bridgeAsyncExceptions } from './errors';
import type { Status, TankerOptions, NativeTanker } from './types';
import {
  Verification,
  assertVerification,
  VerificationOptions,
} from './verification';

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
}
