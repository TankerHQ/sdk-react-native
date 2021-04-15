import type { NativeEncryptionSession } from './types';
import { bridgeAsyncExceptions, bridgeSyncResult } from './errors';
import { Native } from './native';

export class EncryptionSession {
  private readonly instance: NativeEncryptionSession;

  constructor(instance: NativeEncryptionSession) {
    this.instance = instance;
  }

  // Call this method to free up memory once the encryption session can be discarded
  // You may not call any other methods after close
  close(): void {
    return bridgeSyncResult(() =>
      Native.encryptionSessionDestroy(this.instance)
    );
  }

  get resourceId(): string {
    return bridgeSyncResult(() =>
      Native.encryptionSessionGetResourceId(this.instance)
    );
  }

  encrypt(clearText: string): Promise<string> {
    return bridgeAsyncExceptions(
      Native.encryptionSessionEncryptString(this.instance, clearText)
    );
  }

  encryptData(clearData: string): Promise<string> {
    return bridgeAsyncExceptions(
      Native.encryptionSessionEncryptData(this.instance, clearData)
    );
  }
}
