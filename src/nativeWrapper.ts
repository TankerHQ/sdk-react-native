import { Native } from './native';
import type { Status, TankerOptions, NativeTanker } from './types';

export class Tanker {
  private readonly instance: NativeTanker;

  constructor(options: TankerOptions) {
    this.instance = Native.create(options);
  }

  get version(): string {
    return Native.getVersion();
  }

  get status(): Status {
    return Native.getStatus(this.instance);
  }

  get deviceId(): string {
    return Native.getDeviceId(this.instance);
  }

  start(identity: String): Promise<Status> {
    return Native.start(this.instance, identity);
  }

  stop(): Promise<void> {
    return Native.stop(this.instance);
  }
}
