import { InvalidArgument } from '@tanker/errors';
import { assertNotEmptyString } from './types';

export type EmailVerificationMethod = { type: 'email'; email: string };
export type PassphraseVerificationMethod = { type: 'passphrase' };
export type KeyVerificationMethod = { type: 'verificationKey' };
export type OIDCVerificationMethod = {
  type: 'oidcIdToken';
  providerId: string;
  providerDisplayName: string;
};
export type PhoneNumberVerificationMethod = {
  type: 'phoneNumber';
  phoneNumber: string;
};
export type PreverifiedEmailVerificationMethod = {
  type: 'preverifiedEmail';
  preverifiedEmail: string;
};
export type PreverifiedPhoneNumberVerificationMethod = {
  type: 'preverifiedPhoneNumber';
  preverifiedPhoneNumber: string;
};
export type E2ePassphraseVerificationMethod = { type: 'e2ePassphrase' };

export type VerificationMethod =
  | EmailVerificationMethod
  | PassphraseVerificationMethod
  | KeyVerificationMethod
  | OIDCVerificationMethod
  | PhoneNumberVerificationMethod
  | PreverifiedEmailVerificationMethod
  | PreverifiedPhoneNumberVerificationMethod
  | E2ePassphraseVerificationMethod;

export type EmailVerification = { email: string; verificationCode: string };
export type PassphraseVerification = { passphrase: string };
export type KeyVerification = { verificationKey: string };
export type OIDCAuthorizationCodeVerification = {
  oidcProviderId: string;
  oidcAuthorizationCode: string;
  oidcState: string;
};
export type OIDCVerification = { oidcIdToken: string };
export type PhoneNumberVerification = {
  phoneNumber: string;
  verificationCode: string;
};
export type PreverifiedEmailVerification = { preverifiedEmail: string };
export type PreverifiedPhoneNumberVerification = {
  preverifiedPhoneNumber: string;
};
export type PreverifiedOidcVerification = {
  preverifiedOidcSubject: string;
  oidcProviderId: string;
};
export type E2ePassphraseVerification = { e2ePassphrase: string };

export type Verification =
  | EmailVerification
  | PassphraseVerification
  | KeyVerification
  | OIDCAuthorizationCodeVerification
  | OIDCVerification
  | PhoneNumberVerification
  | PreverifiedEmailVerification
  | PreverifiedPhoneNumberVerification
  | PreverifiedOidcVerification
  | E2ePassphraseVerification;

export type VerificationOptions = {
  withSessionToken?: boolean;
  allowE2eMethodSwitch?: boolean;
};

const validMethods = [
  'email',
  'passphrase',
  'verificationKey',
  'oidcAuthorizationCode',
  'oidcIdToken',
  'phoneNumber',
  'preverifiedEmail',
  'preverifiedPhoneNumber',
  'preverifiedOidcSubject',
  'e2ePassphrase',
];
const validKeys = [
  ...validMethods,
  'verificationCode',
  'oidcProviderId',
  'oidcState',
];
const validVerifOptionsKeys = ['withSessionToken', 'allowE2eMethodSwitch'];

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
    assertNotEmptyString(verification.email, 'verification.email');
    if (!('verificationCode' in verification)) {
      throw new InvalidArgument(
        'verification',
        'email verification should also have a verificationCode',
        verification
      );
    }
    assertNotEmptyString(
      verification.verificationCode,
      'verification.verificationCode'
    );
  } else if ('passphrase' in verification) {
    assertNotEmptyString(verification.passphrase, 'verification.passphrase');
  } else if ('verificationKey' in verification) {
    assertNotEmptyString(
      verification.verificationKey,
      'verification.verificationKey'
    );
  } else if ('oidcAuthorizationCode' in verification) {
    assertNotEmptyString(
      verification.oidcProviderId,
      'verification.oidcProviderId'
    );
    assertNotEmptyString(
      verification.oidcAuthorizationCode,
      'verification.oidcAuthorizationCode'
    );
    assertNotEmptyString(verification.oidcState, 'verification.oidcState');
  } else if ('oidcIdToken' in verification) {
    assertNotEmptyString(verification.oidcIdToken, 'verification.oidcIdToken');
  } else if ('phoneNumber' in verification) {
    assertNotEmptyString(verification.phoneNumber, 'verification.phoneNumber');
    if (!('verificationCode' in verification)) {
      throw new InvalidArgument(
        'verification',
        'phoneNumber verification should also have a verificationCode',
        verification
      );
    }
    assertNotEmptyString(
      verification.verificationCode,
      'verification.verificationCode'
    );
  } else if ('preverifiedEmail' in verification) {
    assertNotEmptyString(
      verification.preverifiedEmail,
      'verification.preverifiedEmail'
    );
  } else if ('preverifiedPhoneNumber' in verification) {
    assertNotEmptyString(
      verification.preverifiedPhoneNumber,
      'verification.preverifiedPhoneNumber'
    );
  } else if ('preverifiedOidcSubject' in verification) {
    assertNotEmptyString(
      verification.preverifiedOidcSubject,
      'verification.preverifiedOidcSubject'
    );
    if (!('oidcProviderId' in verification)) {
      throw new InvalidArgument(
        'verification',
        'oidc pre-verification should also have a oidcProviderId',
        verification
      );
    }
    assertNotEmptyString(
      verification.oidcProviderId,
      'verification.oidcProviderId'
    );
  } else if ('e2ePassphrase' in verification) {
    assertNotEmptyString(
      verification.e2ePassphrase,
      'verification.e2ePassphrase'
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

  if (
    'allowE2eMethodSwitch' in options &&
    typeof options.allowE2eMethodSwitch !== 'boolean'
  )
    throw new InvalidArgument(
      'options',
      'allowE2eMethodSwitch must be a boolean',
      options
    );
};
