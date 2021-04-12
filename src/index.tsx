import { Native } from './native';
export { statuses, Status, TankerOptions, NativeTanker } from './types';
export { Tanker } from './nativeWrapper';
import { bridgeAsyncExceptions } from './errors';

export async function prehashPassword(password: string): Promise<string> {
  return bridgeAsyncExceptions(Native.prehashPassword(password));
}
