import { Native } from './native';
export { statuses, Status, TankerOptions, NativeTanker } from './types';
export { Tanker } from './nativeWrapper';

export async function prehashPassword(password: string): Promise<string> {
  return Native.prehashPassword(password);
}
