import { Native } from './native';
export { statuses, Status, TankerOptions, NativeTanker } from './types';
export { Tanker } from './nativeWrapper';
import { bridgeAsyncExceptions } from './errors';
export { errors } from './errors';
import type { LogRecord } from './types';
import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';

let EVENT_LISTENER: EmitterSubscription | null = null;

export async function prehashPassword(password: string): Promise<string> {
  return bridgeAsyncExceptions(Native.prehashPassword(password));
}

export function setLogHandler(handler: (record: LogRecord) => void) {
  const eventEmitter = new NativeEventEmitter(NativeModules.ClientReactNative);
  if (EVENT_LISTENER) EVENT_LISTENER?.remove();
  EVENT_LISTENER = eventEmitter.addListener('tankerLogHandlerEvent', (ev) =>
    handler(ev)
  );
}
