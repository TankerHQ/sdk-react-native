import { Native } from './native';
import { bridgeAsyncExceptions } from './errors';
import type { LogRecord } from './types';
import {
  type EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';

export { Status } from './types';
export type {
  AttachResult,
  LogRecord,
  NativeTanker,
  TankerOptions,
} from './types';
export { Tanker } from './nativeWrapper';
export { Padding } from './encryptionOptions';
export { errors } from './errors';

let EVENT_LISTENER: EmitterSubscription | null = null;

export async function prehashPassword(password: string): Promise<string> {
  return bridgeAsyncExceptions(Native.prehashPassword(password));
}

export async function prehashAndEncryptPassword(
  password: string,
  publicKey: string
): Promise<string> {
  return bridgeAsyncExceptions(
    Native.prehashAndEncryptPassword(password, publicKey)
  );
}

// FIXME: Don't directly call NativeModules, that won't work with Turbo
export function setLogHandler(handler: (record: LogRecord) => void) {
  const eventEmitter = new NativeEventEmitter(NativeModules.ClientReactNative);
  if (EVENT_LISTENER) EVENT_LISTENER?.remove();
  EVENT_LISTENER = eventEmitter.addListener('tankerLogHandlerEvent', (ev) =>
    handler(ev)
  );
}
