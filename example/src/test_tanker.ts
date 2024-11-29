import { Tanker, Status, setLogHandler } from '@tanker/client-react-native';
import { expect, describe, beforeEach, afterEach, it } from './framework';
import {
  createIdentity,
  createProvisionalIdentity,
  getPublicIdentity,
  getEmailVerificationCode,
} from './admin';
import { InvalidArgument, IdentityAlreadyAttached } from '@tanker/errors';
import { createTanker, clearTankerDataDirs } from './tests';

export const tankerTests = () => {
  describe('Tanker tests', () => {
    let tanker: Tanker;
    let identity: string;
    beforeEach(async () => {
      tanker = await createTanker();
      identity = await createIdentity();
    });
    afterEach(async () => {
      await tanker.stop();
      await clearTankerDataDirs();
    });

    it('can start and stop', async () => {
      expect(tanker.status).eq(Status.STOPPED);
      await tanker.start(identity);
      expect(tanker.status).eq(Status.IDENTITY_REGISTRATION_NEEDED);
      await tanker.stop();
      expect(tanker.status).eq(Status.STOPPED);
    });

    it('can reuse the Tanker object after stop', async () => {
      await tanker.start(identity);
      await tanker.stop();
      await tanker.start(identity);
      expect(tanker.status).eq(Status.IDENTITY_REGISTRATION_NEEDED);
    });

    it('calls the log handler', async () => {
      const prom = new Promise((resolve) => {
        setLogHandler((record) => {
          resolve(record.message);
        });
      });
      await tanker.start(identity);
      expect(prom).eventually.is.not.empty;
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

    it('can add members to a group', async () => {
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

    it('can remove members from a group', async () => {
      const other = await createTanker();
      const otherIdent = await createIdentity();
      const otherPubIdent = await getPublicIdentity(otherIdent);
      await other.start(otherIdent);
      await other.registerIdentity({ passphrase: 'otherpass' });

      await tanker.start(identity);
      await tanker.registerIdentity({ passphrase: 'say it again' });
      const groupId = await tanker.createGroup([
        await getPublicIdentity(identity),
        otherPubIdent,
      ]);

      await tanker.updateGroupMembers(groupId, {
        usersToRemove: [otherPubIdent],
      });

      const plaintext = 'say it again';
      const encrypted = await tanker.encrypt(plaintext, {
        shareWithGroups: [groupId],
      });

      await expect(other.decrypt(encrypted)).is.eventually.rejectedWith(
        InvalidArgument,
        'key not found'
      );
      await other.stop();
    });

    it('throws when updating a group without changing anything', async () => {
      await tanker.start(identity);
      await tanker.registerIdentity({ passphrase: 'say it again' });
      const groupId = await tanker.createGroup([
        await getPublicIdentity(identity),
      ]);

      await expect(
        tanker.updateGroupMembers(groupId, {})
      ).is.eventually.rejectedWith(
        InvalidArgument,
        'no members to add or remove'
      );
    });

    it('can attach a provisional identity', async () => {
      await tanker.start(identity);
      await tanker.registerIdentity({
        passphrase: 'ice cold water',
      });
      const email = 'bob@burger.io';
      const provIdentity = await createProvisionalIdentity(email);
      const result = await tanker.attachProvisionalIdentity(provIdentity);
      expect(result.status).eq(Status.IDENTITY_VERIFICATION_NEEDED);
      expect(result.verificationMethod).deep.eq({
        type: 'email',
        email,
      });

      const verificationCode = await getEmailVerificationCode(email);
      await tanker.verifyProvisionalIdentity({ email, verificationCode });
    });

    it('throws when attaching an already attached provisional identity', async () => {
      await tanker.start(identity);
      await tanker.registerIdentity({
        passphrase: 'ice cold water',
      });
      const email = 'bob@burger.io';
      const provIdentity = await createProvisionalIdentity(email);
      const result = await tanker.attachProvisionalIdentity(provIdentity);
      expect(result.verificationMethod).deep.eq({
        type: 'email',
        email,
      });

      const verificationCode = await getEmailVerificationCode(email);
      await tanker.verifyProvisionalIdentity({ email, verificationCode });

      const other = await createTanker();
      await other.start(await createIdentity());
      await other.registerIdentity({ passphrase: 'otherpass' });
      await other.attachProvisionalIdentity(provIdentity);
      expect(result.status).eq(Status.IDENTITY_VERIFICATION_NEEDED);
      const verificationCode2 = await getEmailVerificationCode(email);
      await expect(
        other.verifyProvisionalIdentity({
          email,
          verificationCode: verificationCode2,
        })
      ).to.be.rejectedWith(IdentityAlreadyAttached);
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
      const verificationCode = await getEmailVerificationCode(email);
      await tanker.registerIdentity({ email, verificationCode });
      const result = await tanker.attachProvisionalIdentity(provIdentity);
      expect(result.status).eq(Status.READY);
      expect(result.verificationMethod).is.undefined;
    });
  });
};
