// This file doesn't use jest's expect
/* eslint-disable jest/valid-expect */

import { Tanker, statuses } from '@tanker/client-react-native';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { describe, beforeEach, afterEach, it } from './framework';
import { createIdentity, toggle2FA } from './admin';
import { InvalidArgument, InvalidVerification } from '@tanker/errors';
import { createTanker, clearTankerDataDirs } from './tests';

chai.use(chaiAsPromised);

export const tankerTests = () => {
  describe('Tanker tests', () => {
    let tanker: Tanker;
    let identity: String;
    beforeEach(async () => {
      tanker = await createTanker();
      identity = await createIdentity();
    });
    afterEach(clearTankerDataDirs);

    it('can start and stop', async () => {
      expect(tanker.status).eq(statuses.STOPPED);
      await tanker.start(identity);
      expect(tanker.status).eq(statuses.IDENTITY_REGISTRATION_NEEDED);
      await tanker.stop();
      expect(tanker.status).eq(statuses.STOPPED);
    });

    it('fails to start with an invalid identity', async () => {
      // If our exception bridge is working, the C error should have turned into the right JS class and message
      await expect(tanker.start('Invalid')).is.eventually.rejectedWith(
        InvalidArgument,
        'identity format'
      );
    });

    it('gets a sensible error from a bad registerIdentity', async () => {
      await tanker.start(identity);
      await expect(
        tanker.registerIdentity({
          email: 'enoent@example.com',
          verificationCode: 'xxxx',
        })
      ).is.eventually.rejectedWith(InvalidVerification, 'verification code');
    });

    it('gets a sensible error from a type error in registerIdentity', async () => {
      await tanker.start(identity);
      expect(() =>
        tanker.registerIdentity({
          // @ts-ignore Breaking things on purpose for the test =)
          enoent: '',
        })
      ).throws(InvalidArgument);
    });

    it('can use registerIdentity to open a session', async () => {
      await tanker.start(identity);
      await tanker.registerIdentity({ passphrase: 'foo' });
      expect(tanker.status).eq(statuses.READY);
    });

    it('can use verifyIdentity to open a session', async () => {
      await tanker.start(identity);
      await tanker.registerIdentity({ passphrase: 'foo' });
      expect(tanker.status).eq(statuses.READY);

      let secondDevice = await createTanker();
      await secondDevice.start(identity);
      expect(secondDevice.status).eq(statuses.IDENTITY_VERIFICATION_NEEDED);

      await secondDevice.verifyIdentity({ passphrase: 'foo' });
      expect(secondDevice.status).eq(statuses.READY);
    });

    it('can use setVerificationMethod to change a passphrase', async () => {
      const pass1 = { passphrase: 'foo' };
      const pass2 = { passphrase: 'bar' };

      await tanker.start(identity);
      await tanker.registerIdentity(pass1);
      await tanker.setVerificationMethod(pass2);

      let secondDevice = await createTanker();
      await secondDevice.start(identity);
      await secondDevice.verifyIdentity(pass2);
      expect(secondDevice.status).eq(statuses.READY);
    });

    it('can request a session token with VerificationOptions', async () => {
      await toggle2FA(true);
      await tanker.start(identity);
      const token = await tanker.registerIdentity(
        { passphrase: 'foo' },
        { withSessionToken: true }
      );
      await toggle2FA(false);
      expect(tanker.status).eq(statuses.READY);
      expect(token).is.not.empty;
    });
  });
};
