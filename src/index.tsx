import { Native } from './native';
export type { Status, TankerOptions, NativeTanker } from './types';
export { Tanker } from './nativeWrapper';
export { Padding } from './encryptionOptions';
import { bridgeAsyncExceptions } from './errors';
export { errors } from './errors';
import type { LogRecord } from './types';
import {
  type EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';

let EVENT_LISTENER: EmitterSubscription | null = null;

export async function prehashPassword(password: string): Promise<string> {
  return bridgeAsyncExceptions(Native.prehashPassword(password));
}

// FIXME: Don't directly call NativeModules, that won't work with Turbo
export function setLogHandler(handler: (record: LogRecord) => void) {
  const eventEmitter = new NativeEventEmitter(NativeModules.ClientReactNative);
  if (EVENT_LISTENER) EVENT_LISTENER?.remove();
  EVENT_LISTENER = eventEmitter.addListener('tankerLogHandlerEvent', (ev) =>
    handler(ev)
  );
}
