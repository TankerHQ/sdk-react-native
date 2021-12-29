// This file doesn't use jest's expect
/* eslint-disable jest/valid-expect */

import { expect } from 'chai';
import type { Tanker } from '@tanker/client-react-native';
import { Padding } from '@tanker/client-react-native';
import { describe, beforeEach, afterEach, it } from './framework';
import { createIdentity, getPublicIdentity } from './admin';
import { InvalidArgument } from '@tanker/errors';
import { createTanker, clearTankerDataDirs, getPaddedSize } from './tests';
import type { EncryptionSession } from '../../src/encryptionSessionWrapper';

const encryptionSessionOverhead = 57;
const encryptionSessionPaddedOverhead = encryptionSessionOverhead + 1;

export const encryptionSessionTests = () => {
  describe('Encryption session tests', () => {
    let tanker: Tanker;
    let identity: String;
    let session: EncryptionSession;
    beforeEach(async () => {
      tanker = await createTanker();
      identity = await createIdentity();
      await tanker.start(identity);
      await tanker.registerIdentity({ passphrase: '********' });
      session = await tanker.createEncryptionSession();
    });
    afterEach(async () => {
      session.close();
      await tanker.stop();
      await clearTankerDataDirs();
    });

    it('retrieves the resource ID', async () => {
      const encrypted = await session.encrypt('less than three');
      const resId = await tanker.getResourceId(encrypted);
      const sessResId = session.resourceId;

      expect(sessResId).is.not.empty;
      expect(sessResId).eq(resId);
    });

    it('roundtrips a basic encrypt', async () => {
      const plaintext = 'foo';
      const encrypted = await session.encrypt(plaintext);
      const decrypted = await tanker.decrypt(encrypted);
      expect(decrypted).eq(plaintext);
    });

    it('uses encryption options to share', async () => {
      const other = await createTanker();
      const otherPrivIdent = await createIdentity();
      await other.start(otherPrivIdent);
      await other.registerIdentity({ passphrase: 'otherpass' });
      const otherIdent = await getPublicIdentity(otherPrivIdent);

      const plaintext = 'foo';
      const options = { shareWithSelf: false, shareWithUsers: [otherIdent] };
      const otherSess = await tanker.createEncryptionSession(options);
      const encrypted = await otherSess.encrypt(plaintext);
      otherSess.close();

      const decrypted = await other.decrypt(encrypted);
      await other.stop();

      await expect(tanker.decrypt(encrypted)).is.eventually.rejectedWith(
        InvalidArgument,
        "can't find key"
      );

      expect(decrypted).eq(plaintext);
    });

    it('roundtrips with encryptData', async () => {
      const plaindata = 'dW5kZXIgY29vbCBtb29ubGlnaHQ=';
      const encrypted = await session.encryptData(plaindata);
      const decrypted = await tanker.decryptData(encrypted);
      expect(decrypted).eq(plaindata);
    });

    it('fails to pass a non-base64 plaintext to encryptData', async () => {
      const plaintext = 'plain text';
      await expect(session.encryptData(plaintext)).eventually.rejectedWith(
        InvalidArgument
      );
    });

    it('encrypts with auto padding by default', async () => {
      const plaintext = 'my clear data is clear!';
      const lengthWithPadme = 24;

      const encrypted = await session.encrypt(plaintext);

      const paddedSize = getPaddedSize(
        encrypted,
        encryptionSessionPaddedOverhead
      );
      expect(paddedSize).eq(lengthWithPadme);

      const decrypted = await tanker.decrypt(encrypted);
      expect(decrypted).eq(plaintext);
    });

    it('encrypts with auto padding', async () => {
      const aliceSession = await tanker.createEncryptionSession({
        paddingStep: Padding.AUTO,
      });

      const plaintext = 'my clear data is clear!';
      const lengthWithPadme = 24;

      const encrypted = await aliceSession.encrypt(plaintext);

      const paddedSize = getPaddedSize(
        encrypted,
        encryptionSessionPaddedOverhead
      );
      expect(paddedSize).eq(lengthWithPadme);

      const decrypted = await tanker.decrypt(encrypted);
      expect(decrypted).eq(plaintext);
    });

    it('encrypts with no padding', async () => {
      const aliceSession = await tanker.createEncryptionSession({
        paddingStep: Padding.OFF,
      });

      const plaintext = 'my clear data is clear!';
      const encrypted = await aliceSession.encrypt(plaintext);

      const paddedSize = getPaddedSize(encrypted, encryptionSessionOverhead);
      expect(paddedSize).eq(plaintext.length);

      const decrypted = await tanker.decrypt(encrypted);
      expect(decrypted).eq(plaintext);
    });

    it('encrypts with a padding step', async () => {
      const step = 13;
      const aliceSession = await tanker.createEncryptionSession({
        paddingStep: step,
      });

      const plaintext = 'my clear data is clear!';
      const encrypted = await aliceSession.encrypt(plaintext);

      const paddedSize = getPaddedSize(
        encrypted,
        encryptionSessionPaddedOverhead
      );
      expect(paddedSize % step).eq(0);

      const decrypted = await tanker.decrypt(encrypted);
      expect(decrypted).eq(plaintext);
    });

    it('fails to createEncryptionSession with a bad paddingStep', async () => {
      await Promise.all(
        [-1, 0, 1, 2.42, 'a random string', null].map(async (x) => {
          await expect(
            // @ts-expect-error
            tanker.createEncryptionSession({ paddingStep: x })
          ).eventually.rejectedWith(InvalidArgument);
        })
      );
    });
  });
};
