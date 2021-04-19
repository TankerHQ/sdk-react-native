// This file doesn't use jest's expect
/* eslint-disable jest/valid-expect */

import { expect } from 'chai';
import type { Tanker } from '@tanker/client-react-native';
import { describe, beforeEach, afterEach, it } from './framework';
import { createIdentity, getPublicIdentity } from './admin';
import { InvalidArgument } from '@tanker/errors';
import { createTanker, clearTankerDataDirs } from './tests';

export const encryptionTests = () => {
  describe('Encryption tests', () => {
    let tanker: Tanker;
    let identity: String;
    beforeEach(async () => {
      tanker = await createTanker();
      identity = await createIdentity();
      await tanker.start(identity);
      await tanker.registerIdentity({ passphrase: '********' });
    });
    afterEach(async () => {
      await tanker.stop();
      await clearTankerDataDirs();
    });

    it.only('can roundtrip a basic encrypt', async () => {
      const plaintext = 'foo';
      const encrypted = await tanker.encrypt(plaintext);
      const decrypted = await tanker.decrypt(encrypted);
      expect(decrypted).eq(plaintext);
    });

    it.only('fails to decrypt bad base64', async () => {
      // This kind of basic error handling test is not as trivial as it looks, because there are
      // _many_ kinds of errors in a native module that result in a hang, not an exception (JS promise not resolved)
      await expect(tanker.decrypt('Not base 64!')).eventually.rejectedWith(
        InvalidArgument
      );
    });

    it.only('can use encryption options to share', async () => {
      const other = await createTanker();
      const otherPrivIdent = await createIdentity();
      await other.start(otherPrivIdent);
      await other.registerIdentity({ passphrase: 'otherpass' });
      const otherIdent = await getPublicIdentity(otherPrivIdent);

      const plaintext = 'foo';
      const options = { shareWithSelf: false, shareWithUsers: [otherIdent] };
      const encrypted = await tanker.encrypt(plaintext, options);

      const decrypted = await other.decrypt(encrypted);
      await other.stop();

      await expect(tanker.decrypt(encrypted)).is.eventually.rejectedWith(
        InvalidArgument,
        "can't find key"
      );

      expect(decrypted).eq(plaintext);
    });

    it.only('can roundtrip with encryptData', async () => {
      const plaindata = 'dW5kZXIgY29vbCBtb29ubGlnaHQ=';
      const encrypted = await tanker.encryptData(plaindata);
      const decrypted = await tanker.decryptData(encrypted);
      expect(decrypted).eq(plaindata);
    });

    it.only('cannot pass a non-base64 plaintext to encryptData', async () => {
      // NOTE: Android cannot be told to reject unpadded Base64 (though if there is padding, it must be correct),
      // that's why we explicitely pick a plaintext with a space (invalid charset) for this test
      const plaintext = 'plain text';
      await expect(tanker.encryptData(plaintext)).eventually.rejectedWith(
        InvalidArgument
      );
    });

    it.only('encryptData correctly un-base64-ifies before encrypt', async () => {
      const plaindata = 'ZmlyZQ==';
      const plaintext = 'fire';

      // When we decrypt as a _string_ something encrypted as a _binary_, so the native module will try decoding the
      // decrypted data as UTF-8. plaindata happens to be a string, so we get to observe if its behavior is correct
      const encrypted = await tanker.encryptData(plaindata);
      const decrypted = await tanker.decrypt(encrypted);
      expect(decrypted).eq(plaintext);
    });

    it.only('can get the resourceId for a small encrypted data', async () => {
      const encrypted = await tanker.encrypt('Principalities');
      const resId = await tanker.getResourceId(encrypted);
      expect(resId).is.not.empty;
    });

    it.only('can get the resourceId for a longer encrypted data', async () => {
      const plaintext = `Heap dump: 0x${'41'.repeat(1025)}`;
      const encrypted = await tanker.encrypt(plaintext);
      const resId = await tanker.getResourceId(encrypted);
      expect(resId).is.not.empty;
    });

    it('can share encrypted data', async () => {
      const other = await createTanker();
      const otherPrivIdent = await createIdentity();
      await other.start(otherPrivIdent);
      await other.registerIdentity({ passphrase: 'otherpass' });
      const otherIdent = await getPublicIdentity(otherPrivIdent);

      const plaintext = 'foo';
      const encrypted = await tanker.encrypt(plaintext);
      const resId = await tanker.getResourceId(encrypted);
      const options = { shareWithUsers: [otherIdent] };
      await tanker.share([resId], options);

      const decrypted = await other.decrypt(encrypted);
      await other.stop();
      expect(decrypted).eq(plaintext);
    });
  });
};
