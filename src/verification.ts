import { InvalidArgument } from '@tanker/errors';
import { assertNotEmptyString } from './types';

export type EmailVerificationMethod = { type: 'email'; email: string };
export type PassphraseVerificationMethod = { type: 'passphrase' };
export type KeyVerificationMethod = { type: 'verificationKey' };
export type OIDCVerificationMethod = { type: 'oidcIdToken' };
export type PhoneNumberVerificationMethod = {
  type: 'phoneNumber';
  phoneNumber: string;
};
export type PreverifiedEmailVerificationMethod = { type: 'preverifiedEmail' };
export type PreverifiedPhoneNumberVerificationMethod = {
  type: 'preverifiedPhoneNumber';
};

export type VerificationMethod =
  | EmailVerificationMethod
  | PassphraseVerificationMethod
  | KeyVerificationMethod
  | OIDCVerificationMethod
  | PhoneNumberVerificationMethod
  | PreverifiedEmailVerificationMethod
  | PreverifiedPhoneNumberVerificationMethod;

export type EmailVerification = { email: string; verificationCode: string };
export type PassphraseVerification = { passphrase: string };
export type KeyVerification = { verificationKey: string };
export type OIDCVerification = { oidcIdToken: string };
export type PhoneNumberVerification = {
  phoneNumber: string;
  verificationCode: string;
};
export type PreverifiedEmailVerification = { preverifiedEmail: string };
export type PreverifiedPhoneNumberVerification = {
  preverifiedPhoneNumber: string;
};

export type Verification =
  | EmailVerification
  | PassphraseVerification
  | KeyVerification
  | OIDCVerification
  | PhoneNumberVerification
  | PreverifiedEmailVerification
  | PreverifiedPhoneNumberVerification;

export type VerificationOptions = { withSessionToken?: boolean };

const validMethods = [
  'email',
  'passphrase',
  'verificationKey',
  'oidcIdToken',
  'phoneNumber',
  'preverifiedEmail',
  'preverifiedPhoneNumber',
];
const validKeys = [...validMethods, 'verificationCode'];
const validVerifOptionsKeys = ['withSessionToken'];

export const assertVerification = (verification: Verification) => {
  if (!verification || typeof verification !== 'object')
    throw new InvalidArgument('verification', 'object', verification);

  if (Object.keys(verification).some((k) => !validKeys.includes(k)))
    throw new InvalidArgument(
      'verification',
      `should only contain keys in ${JSON.stringify(validKeys)}`,
      verification
    );

  const methodCount = validMethods.reduce(
    (count, key) => count + (key in verification ? 1 : 0),
    0
  );

  if (methodCount !== 1)
    throw new InvalidArgument(
      'verification',
      `should contain a single verification method in ${JSON.stringify(
        validMethods
      )}`,
      verification
    );

  if ('email' in verification) {
    // $FlowIgnore[prop-missing]
    assertNotEmptyString(verification.email, 'verification.email');
    if (!('verificationCode' in verification)) {
      throw new InvalidArgument(
        'verification',
        'email verification should also have a verificationCode',
        verification
      );
    }
    // $FlowIgnore[prop-missing]
    assertNotEmptyString(
      verification.verificationCode,
      'verification.verificationCode'
    );
  } else if ('passphrase' in verification) {
    // $FlowIgnore[prop-missing]
    assertNotEmptyString(verification.passphrase, 'verification.passphrase');
  } else if ('verificationKey' in verification) {
    // $FlowIgnore[prop-missing]
    assertNotEmptyString(
      verification.verificationKey,
      'verification.verificationKey'
    );
  } else if ('oidcIdToken' in verification) {
    // $FlowIgnore[prop-missing]
    assertNotEmptyString(verification.oidcIdToken, 'verification.oidcIdToken');
  } else if ('phoneNumber' in verification) {
    // $FlowIgnore[prop-missing]
    assertNotEmptyString(verification.phoneNumber, 'verification.phoneNumber');
    if (!('verificationCode' in verification)) {
      throw new InvalidArgument(
        'verification',
        'phoneNumber verification should also have a verificationCode',
        verification
      );
    }
    // $FlowIgnore[prop-missing]
    assertNotEmptyString(
      verification.verificationCode,
      'verification.verificationCode'
    );
  } else if ('preverifiedEmail' in verification) {
    // $FlowIgnore[prop-missing]
    assertNotEmptyString(
      verification.preverifiedEmail,
      'verification.preverifiedEmail'
    );
  } else if ('preverifiedPhoneNumber' in verification) {
    // $FlowIgnore[prop-missing]
    assertNotEmptyString(
      verification.preverifiedPhoneNumber,
      'verification.preverifiedPhoneNumber'
    );
  }
};

export const assertVerificationOptions = (options?: VerificationOptions) => {
  if (!options) return;

  // noinspection SuspiciousTypeOfGuard
  if (typeof options !== 'object' || options instanceof Array) {
    throw new InvalidArgument('options', 'object', options);
  }

  if (Object.keys(options).some((k) => !validVerifOptionsKeys.includes(k)))
    throw new InvalidArgument(
      'options',
      `should only contain keys in ${JSON.stringify(validVerifOptionsKeys)}`,
      options
    );

  if (
    'withSessionToken' in options &&
    typeof options.withSessionToken !== 'boolean'
  )
    throw new InvalidArgument(
      'options',
      'withSessionToken must be a boolean',
      options
    );
};
