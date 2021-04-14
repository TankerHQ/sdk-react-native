// This file doesn't use jest's expect
/* eslint-disable jest/valid-expect */

import { Tanker, statuses } from '@tanker/client-react-native';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { describe, beforeEach, afterEach, it } from './framework';
import {
  createIdentity,
  createProvisionalIdentity,
  getPublicIdentity,
  getVerificationCode,
  toggle2FA,
} from './admin';
import { InvalidArgument, InvalidVerification } from '@tanker/errors';
import { createTanker, clearTankerDataDirs } from './tests';

chai.use(chaiAsPromised);

export const tankerTests = () => {
  describe('Tanker tests', () => {
    let tanker: Tanker;
    let identity: string;
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

    it('can use a verificationKey', async () => {
      await tanker.start(identity);
      const verifKey = await tanker.generateVerificationKey();
      expect(verifKey).is.not.empty;
      await tanker.registerIdentity({
        verificationKey: verifKey,
      });
      expect(tanker.status).eq(statuses.READY);
    });

    it('can get verification methods', async () => {
      await tanker.start(identity);
      await tanker.registerIdentity({
        passphrase: 'stickbug',
      });
      const methods = await tanker.getVerificationMethods();
      expect(methods).deep.eq([
        {
          type: 'passphrase',
        },
      ]);
    });

    it('can create a basic group', async () => {
      await tanker.start(identity);
      await tanker.registerIdentity({
        passphrase: 'stickbug',
      });
      const pubIdentity = await getPublicIdentity(identity);
      const groupId = await tanker.createGroup([pubIdentity]);
      expect(groupId).is.not.empty;
    });

    it('can update a group', async () => {
      const other = await createTanker();
      const otherIdent = await createIdentity();
      const otherPubIdent = await getPublicIdentity(otherIdent);
      await other.start(otherIdent);
      await other.registerIdentity({ passphrase: 'otherpass' });

      const plaintext = 'say it again';
      await tanker.start(identity);
      await tanker.registerIdentity({
        passphrase: 'say it again',
      });
      const groupId = await tanker.createGroup([
        await getPublicIdentity(identity),
      ]);
      const encrypted = await tanker.encrypt(plaintext, {
        shareWithGroups: [groupId],
      });

      await tanker.updateGroupMembers(groupId, { usersToAdd: [otherPubIdent] });
      const decrypted = await other.decrypt(encrypted);
      await other.stop();
      expect(decrypted).eq(plaintext);
    });

    it('can attach a provisional identity', async () => {
      await tanker.start(identity);
      await tanker.registerIdentity({
        passphrase: 'ice cold water',
      });
      const email = 'bob@burger.io';
      const provIdentity = await createProvisionalIdentity(email);
      const result = await tanker.attachProvisionalIdentity(provIdentity);
      expect(result.status).eq(statuses.IDENTITY_VERIFICATION_NEEDED);
      expect(result.verificationMethod).deep.eq({ type: 'email', email });

      const verificationCode = await getVerificationCode(email);
      await tanker.verifyProvisionalIdentity({ email, verificationCode });
    });

    it('can skip provisional identity verification', async () => {
      const email = 'bob@bargor.io';
      const provIdentity = await createProvisionalIdentity(email);
      const provPublicIdent = await getPublicIdentity(provIdentity);

      // The server only learns about our prov identity if we _use_ it here!
      const other = await createTanker();
      await other.start(await createIdentity());
      await other.registerIdentity({ passphrase: 'otherpass' });
      await other.encrypt('bleh', { shareWithUsers: [provPublicIdent] });
      await other.stop();

      await tanker.start(identity);
      const verificationCode = await getVerificationCode(email);
      await tanker.registerIdentity({ email, verificationCode });
      const result = await tanker.attachProvisionalIdentity(provIdentity);
      expect(result.status).eq(statuses.READY);
      expect(result.verificationMethod).is.undefined;
    });
  });
};
