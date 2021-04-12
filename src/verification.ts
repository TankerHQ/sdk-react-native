import { InvalidArgument } from '@tanker/errors';

export type EmailVerification = { email: string; verificationCode: string };
export type PassphraseVerification = { passphrase: string };
export type KeyVerification = { verificationKey: string };
export type OIDCVerification = { oidcIdToken: string };

export type Verification =
  | EmailVerification
  | PassphraseVerification
  | KeyVerification
  | OIDCVerification;

const validMethods = ['email', 'passphrase', 'verificationKey', 'oidcIdToken'];
const validKeys = [...validMethods, 'verificationCode'];

const assertNotEmptyString = (arg: any, argName: string) => {
  if (typeof arg !== 'string') {
    throw new InvalidArgument(argName, `${argName} should be a string`, arg);
  }
  if (arg.length === 0) {
    throw new InvalidArgument(argName, `${argName} should not be empty`, arg);
  }
};

export const assertVerification = (verification: Verification) => {
  if (!verification || typeof verification !== 'object')
    throw new InvalidArgument('verification', 'object', verification);

  if (Object.keys(verification).some((k) => !validKeys.includes(k)))
    throw new InvalidArgument(
      'verification',
      `should only contain keys in ${JSON.stringify(validKeys)}`,
      verification
    );

  const methodCound = validMethods.reduce(
    (count, key) => count + (key in verification ? 1 : 0),
    0
  );

  if (methodCound !== 1)
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
  }
};
