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

// NOTE: This cannot be a const enum for compat with TS verbatimModuleSyntax
export enum Status {
  'STOPPED' = 0,
  'READY' = 1,
  'IDENTITY_REGISTRATION_NEEDED' = 2,
  'IDENTITY_VERIFICATION_NEEDED' = 3,
}

const statusDefs: Array<{ name: keyof typeof Status }> = [
  /* 0 */ { name: 'STOPPED' },
  /* 1 */ { name: 'READY' },
  /* 2 */ { name: 'IDENTITY_REGISTRATION_NEEDED' },
  /* 3 */ { name: 'IDENTITY_VERIFICATION_NEEDED' },
];

export const statuses = (() => {
  const h: Partial<Record<keyof typeof Status, Status>> = {};

  statusDefs.forEach((status, index) => {
    h[status.name] = index as Status;
  });

  return h as Record<keyof typeof Status, Status>;
})();

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
