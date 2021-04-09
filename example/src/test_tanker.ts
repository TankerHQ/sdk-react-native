// This file doesn't use jest's expect
/* eslint-disable jest/valid-expect */

import { Tanker, statuses } from '@tanker/client-react-native';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { describe, beforeEach, it } from './framework';
import { createIdentity } from './admin';
import { InvalidArgument, InvalidVerification } from '@tanker/errors';
import { createTanker } from './tests';

chai.use(chaiAsPromised);

export const tankerTests = () => {
  describe('Tanker tests', () => {
    let tanker: Tanker;
    let identity: String;
    beforeEach(async () => {
      tanker = await createTanker();
      identity = await createIdentity();
    });

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
  });
};
