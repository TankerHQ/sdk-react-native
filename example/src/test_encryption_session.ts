// This file doesn't use jest's expect
/* eslint-disable jest/valid-expect */

import { expect } from 'chai';
import type { Tanker } from '@tanker/client-react-native';
import { describe, beforeEach, afterEach, it } from './framework';
import { createIdentity, getPublicIdentity } from './admin';
import { InvalidArgument } from '@tanker/errors';
import { createTanker, clearTankerDataDirs } from './tests';
import type { EncryptionSession } from '../../src/encryptionSessionWrapper';

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

    it.only('can get the resource ID', async () => {
      const encrypted = await session.encrypt('less than three');
      const resId = await tanker.getResourceId(encrypted);
      const sessResId = session.resourceId;

      expect(sessResId).is.not.empty;
      expect(sessResId).eq(resId);
    });

    it.only('can roundtrip a basic encrypt', async () => {
      const plaintext = 'foo';
      const encrypted = await session.encrypt(plaintext);
      const decrypted = await tanker.decrypt(encrypted);
      expect(decrypted).eq(plaintext);
    });

    it.only('can use encryption options to share', async () => {
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

    it('can roundtrip with encryptData', async () => {
      const plaindata = 'dW5kZXIgY29vbCBtb29ubGlnaHQ=';
      const encrypted = await session.encryptData(plaindata);
      const decrypted = await tanker.decryptData(encrypted);
      expect(decrypted).eq(plaindata);
    });

    it('cannot pass a non-base64 plaintext to encryptData', async () => {
      const plaintext = 'plain text';
      await expect(session.encryptData(plaintext)).eventually.rejectedWith(
        InvalidArgument
      );
    });
  });
};
