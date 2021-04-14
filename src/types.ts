import { InvalidArgument } from '@tanker/errors';
import type { EmailVerificationMethod } from './verification';

export type NativeTanker = number;

export type TankerOptions = {
  appId: string;
  writablePath?: string;
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
  verificationMethod?: EmailVerificationMethod;
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
