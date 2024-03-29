// This file doesn't use jest's expect
/* eslint-disable jest/valid-expect */

import { Tanker, setLogHandler } from '@tanker/client-react-native';
import { expect } from 'chai';
import { describe, beforeEach, afterEach, it } from './framework';
import {
  createIdentity,
  createProvisionalIdentity,
  getPublicIdentity,
  getEmailVerificationCode,
  getSMSVerificationCode,
  togglePreverifiedVerification,
} from './admin';
import {
  InvalidArgument,
  InvalidVerification,
  IdentityAlreadyAttached,
  PreconditionFailed,
} from '@tanker/errors';
import { createTanker, clearTankerDataDirs } from './tests';
import base64 from 'react-native-base64';

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
      expect(tanker.status).eq(Tanker.statuses.STOPPED);
      await tanker.start(identity);
      expect(tanker.status).eq(Tanker.statuses.IDENTITY_REGISTRATION_NEEDED);
      await tanker.stop();
      expect(tanker.status).eq(Tanker.statuses.STOPPED);
    });

    it('can reuse the Tanker object after stop', async () => {
      await tanker.start(identity);
      await tanker.stop();
      await tanker.start(identity);
      expect(tanker.status).eq(Tanker.statuses.IDENTITY_REGISTRATION_NEEDED);
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
      expect(
        tanker.registerIdentity({
          // @ts-ignore Breaking things on purpose for the test =)
          enoent: '',
        })
      ).eventually.rejectedWith(InvalidArgument);
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

    it('can use registerIdentity to open a session', async () => {
      await tanker.start(identity);
      await tanker.registerIdentity({ passphrase: 'foo' });
      expect(tanker.status).eq(Tanker.statuses.READY);
    });

    it('can use registerIdentity to open a session with a phone number', async () => {
      const phoneNumber = '+33639982233';
      const verificationCode = await getSMSVerificationCode(phoneNumber);

      await tanker.start(identity);
      expect(tanker.status).eq(Tanker.statuses.IDENTITY_REGISTRATION_NEEDED);
      await tanker.registerIdentity({ phoneNumber, verificationCode });
      expect(tanker.status).eq(Tanker.statuses.READY);
    });

    it('can use verifyIdentity to open a session', async () => {
      await tanker.start(identity);
      await tanker.registerIdentity({ passphrase: 'foo' });
      expect(tanker.status).eq(Tanker.statuses.READY);

      let secondDevice = await createTanker();
      await secondDevice.start(identity);
      expect(secondDevice.status).eq(
        Tanker.statuses.IDENTITY_VERIFICATION_NEEDED
      );

      await secondDevice.verifyIdentity({ passphrase: 'foo' });
      expect(secondDevice.status).eq(Tanker.statuses.READY);
      await secondDevice.stop();
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
      expect(secondDevice.status).eq(Tanker.statuses.READY);
      await secondDevice.stop();
    });

    it('fails to register with preverified email', async () => {
      togglePreverifiedVerification(true);
      const email = 'bob@burger.io';
      await tanker.start(identity);
      await expect(
        tanker.registerIdentity({ preverifiedEmail: email })
      ).is.rejectedWith(InvalidArgument);
    });

    it('fails to register with preverified phone number', async () => {
      togglePreverifiedVerification(true);
      const phoneNumber = '+33639982233';
      await tanker.start(identity);
      await expect(
        tanker.registerIdentity({ preverifiedPhoneNumber: phoneNumber })
      ).is.rejectedWith(InvalidArgument);
    });

    it('fails to verify with preverified email', async () => {
      togglePreverifiedVerification(true);
      const email = 'bob@burger.io';
      await tanker.start(identity);
      const verificationCode = await getEmailVerificationCode(email);
      await tanker.registerIdentity({ email, verificationCode });

      let secondDevice = await createTanker();
      await secondDevice.start(identity);
      await expect(
        secondDevice.verifyIdentity({ preverifiedEmail: email })
      ).is.rejectedWith(InvalidArgument);

      await secondDevice.stop();
    });

    it('fails to verify with preverified phone number', async () => {
      togglePreverifiedVerification(true);
      const phoneNumber = '+33639982233';
      await tanker.start(identity);
      const verificationCode = await getSMSVerificationCode(phoneNumber);
      await tanker.registerIdentity({ phoneNumber, verificationCode });

      let secondDevice = await createTanker();
      await secondDevice.start(identity);
      await expect(
        secondDevice.verifyIdentity({
          preverifiedPhoneNumber: phoneNumber,
        })
      ).is.rejectedWith(InvalidArgument);

      await secondDevice.stop();
    });

    it('can use set verification method with preverified email', async () => {
      togglePreverifiedVerification(true);
      const email = 'bob@burger.io';
      const pass = { passphrase: 'Shame, dring dring' };
      await tanker.start(identity);
      await tanker.registerIdentity(pass);
      await tanker.setVerificationMethod({ preverifiedEmail: email });

      expect(await tanker.getVerificationMethods()).to.have.deep.members([
        {
          type: 'passphrase',
        },
        {
          type: 'preverifiedEmail',
          preverifiedEmail: email,
        },
      ]);

      let secondDevice = await createTanker();
      await secondDevice.start(identity);

      const verificationCode = await getEmailVerificationCode(email);
      await secondDevice.verifyIdentity({ email, verificationCode });
      expect(secondDevice.status).eq(Tanker.statuses.READY);

      expect(await secondDevice.getVerificationMethods()).to.have.deep.members([
        {
          type: 'passphrase',
        },
        {
          type: 'email',
          email: email,
        },
      ]);

      await secondDevice.stop();
    });

    it('can use set verification method with preverified phone number', async () => {
      togglePreverifiedVerification(true);
      const phoneNumber = '+33639982233';
      const pass = { passphrase: 'Shame, dring dring' };
      await tanker.start(identity);
      await tanker.registerIdentity(pass);
      await tanker.setVerificationMethod({
        preverifiedPhoneNumber: phoneNumber,
      });

      expect(await tanker.getVerificationMethods()).to.have.deep.members([
        {
          type: 'passphrase',
        },
        {
          type: 'preverifiedPhoneNumber',
          preverifiedPhoneNumber: phoneNumber,
        },
      ]);

      let secondDevice = await createTanker();
      await secondDevice.start(identity);

      const verificationCode = await getSMSVerificationCode(phoneNumber);
      await secondDevice.verifyIdentity({ phoneNumber, verificationCode });
      expect(secondDevice.status).eq(Tanker.statuses.READY);

      expect(await secondDevice.getVerificationMethods()).to.have.deep.members([
        {
          type: 'passphrase',
        },
        {
          type: 'phoneNumber',
          phoneNumber: phoneNumber,
        },
      ]);

      await secondDevice.stop();
    });

    it('can register an e2e passphrase', async () => {
      const e2ePassphrase = 'So we all are agreed';
      await tanker.start(identity);
      await tanker.registerIdentity({ e2ePassphrase });
      await tanker.stop();

      let secondDevice = await createTanker();
      await secondDevice.start(identity);
      await secondDevice.verifyIdentity({ e2ePassphrase });
      expect(secondDevice.status).eq(Tanker.statuses.READY);
      await secondDevice.stop();
    });

    it('can update an e2e passphrase', async () => {
      const oldPassphrase = 'Vorbis';
      const newPassphrase = 'Opus';
      await tanker.start(identity);
      await tanker.registerIdentity({ e2ePassphrase: oldPassphrase });
      await tanker.setVerificationMethod({ e2ePassphrase: newPassphrase });
      await tanker.stop();

      let secondDevice = await createTanker();
      await secondDevice.start(identity);
      await expect(
        secondDevice.verifyIdentity({ e2ePassphrase: oldPassphrase })
      ).is.rejectedWith(InvalidVerification);
      await secondDevice.verifyIdentity({ e2ePassphrase: newPassphrase });
      await secondDevice.stop();
    });

    it('can switch to an e2e passphrase', async () => {
      const oldPassphrase = 'Dantes';
      const newPassphrase = 'Villefort';
      await tanker.start(identity);
      await tanker.registerIdentity({ passphrase: oldPassphrase });
      await tanker.setVerificationMethod(
        { e2ePassphrase: newPassphrase },
        { allowE2eMethodSwitch: true }
      );
      await tanker.stop();

      let secondDevice = await createTanker();
      await secondDevice.start(identity);
      await expect(
        secondDevice.verifyIdentity({ passphrase: oldPassphrase })
      ).is.rejectedWith(PreconditionFailed);
      await secondDevice.verifyIdentity({ e2ePassphrase: newPassphrase });
      await secondDevice.stop();
    });

    it('can switch from an e2e passphrase', async () => {
      const oldPassphrase = 'lp%d ok';
      const newPassphrase = 'lp%d out of paper';
      await tanker.start(identity);
      await tanker.registerIdentity({ e2ePassphrase: oldPassphrase });
      await tanker.setVerificationMethod(
        { passphrase: newPassphrase },
        { allowE2eMethodSwitch: true }
      );
      await tanker.stop();

      let secondDevice = await createTanker();
      await secondDevice.start(identity);
      await expect(
        secondDevice.verifyIdentity({ e2ePassphrase: oldPassphrase })
      ).is.rejectedWith(PreconditionFailed);
      await secondDevice.verifyIdentity({ passphrase: newPassphrase });
      await secondDevice.stop();
    });

    it('cannot switch to an e2e passphrase without allowE2eMethodSwitch flag', async () => {
      const oldPassphrase = 'lp%d off-line';
      const newPassphrase = 'lp%d on fire';
      await tanker.start(identity);
      await tanker.registerIdentity({ passphrase: oldPassphrase });
      await expect(
        tanker.setVerificationMethod({ e2ePassphrase: newPassphrase })
      ).is.rejectedWith(InvalidArgument);
      await tanker.stop();
    });

    it('can request a session token with VerificationOptions', async () => {
      await tanker.start(identity);
      const token = await tanker.registerIdentity(
        { passphrase: 'foo' },
        { withSessionToken: true }
      );
      expect(tanker.status).eq(Tanker.statuses.READY);
      expect(token).is.not.empty;
      // @ts-ignore is.not.empty checks that the token is not undefined
      const tokenData = base64.decode(token);
      expect(tokenData).length.greaterThanOrEqual(32);
    });

    it('can use setVerificationMethod with email to get a session token', async () => {
      await tanker.start(identity);
      await tanker.registerIdentity({
        passphrase: 'Space and time are not what you think',
      });

      const email = 'john.doe@tanker.io';
      const verificationCode = await getEmailVerificationCode(email);
      const token = await tanker.setVerificationMethod(
        { email, verificationCode },
        { withSessionToken: true }
      );

      expect(token).is.not.empty;
      // @ts-ignore is.not.empty checks that the token is not undefined
      const tokenData = base64.decode(token);
      expect(tokenData).length.greaterThanOrEqual(32);
    });

    it('can use setVerificationMethod with phone number to get a session token', async () => {
      await tanker.start(identity);
      await tanker.registerIdentity({
        passphrase: 'Space and time are not what you think',
      });

      const phoneNumber = '+33639982233';
      const verificationCode = await getSMSVerificationCode(phoneNumber);
      const token = await tanker.setVerificationMethod(
        { phoneNumber, verificationCode },
        { withSessionToken: true }
      );

      expect(token).is.not.empty;
      // @ts-ignore is.not.empty checks that the token is not undefined
      const tokenData = base64.decode(token);
      expect(tokenData).length.greaterThanOrEqual(32);
    });

    it('can use a verificationKey', async () => {
      await tanker.start(identity);
      const verifKey = await tanker.generateVerificationKey();
      expect(verifKey).is.not.empty;
      await tanker.registerIdentity({
        verificationKey: verifKey,
      });
      expect(tanker.status).eq(Tanker.statuses.READY);
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
        "can't find keys"
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
      expect(result.status).eq(Tanker.statuses.IDENTITY_VERIFICATION_NEEDED);
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
      expect(result.status).eq(Tanker.statuses.IDENTITY_VERIFICATION_NEEDED);
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
      expect(result.status).eq(Tanker.statuses.READY);
      expect(result.verificationMethod).is.undefined;
    });
  });
};
