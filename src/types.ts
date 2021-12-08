import { InvalidArgument } from '@tanker/errors';
import type { VerificationMethod } from './verification';

export type b64string = string;
export type NativeTanker = number;
export type NativeEncryptionSession = number;

export type TankerOptions = {
  appId: string;
  persistentPath?: string;
  cachePath?: string;
  url?: string;
};

const statusDefs = [
  /* 0 */ { name: 'STOPPED' },
  /* 1 */ { name: 'READY' },
  /* 2 */ { name: 'IDENTITY_REGISTRATION_NEEDED' },
  /* 3 */ { name: 'IDENTITY_VERIFICATION_NEEDED' },
];

export const statuses: { [name: string]: number } = (() => {
  const h: typeof statuses = {};
  statusDefs.forEach((def, index) => {
    h[def.name] = index;
  });
  return h;
})();

export type Status = number;

export type AttachResult = {
  status: Status;
  verificationMethod?: VerificationMethod;
};

export type LogRecord = {
  category: string;
  level: number;
  file: string;
  line: number;
  message: string;
};

export const isObject = (val: Object) =>
  !!val &&
  typeof val === 'object' &&
  Object.getPrototypeOf(val) === Object.prototype;

export const assertNotEmptyString = (arg: any, argName: string) => {
  if (typeof arg !== 'string') {
    throw new InvalidArgument(argName, `${argName} should be a string`, arg);
  }
  if (arg.length === 0) {
    throw new InvalidArgument(argName, `${argName} should not be empty`, arg);
  }
};
