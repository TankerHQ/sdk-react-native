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
}
