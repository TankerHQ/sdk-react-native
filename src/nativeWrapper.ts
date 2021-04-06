import { Native, TankerOptions, NativeTanker } from './native';

export class Tanker {
  private readonly instance: NativeTanker;

  constructor(options: TankerOptions) {
    this.instance = Native.create(options);
  }

  get version(): string {
    return Native.getVersion();
  }

  get appId(): string {
    return Native.getAppId(this.instance);
  }
}
