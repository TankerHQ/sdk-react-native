// This file doesn't use jest's expect
/* eslint-disable jest/valid-expect */

import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import type { Tanker } from '@tanker/client-react-native';
import { describe, beforeEach, afterEach, it } from './framework';
import { createIdentity, getPublicIdentity } from './admin';
import { InvalidArgument } from '@tanker/errors';
import { createTanker, clearTankerDataDirs } from './tests';

chai.use(chaiAsPromised);

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

    it('can roundtrip a basic encrypt', async () => {
      const plaintext = 'foo';
      const encrypted = await tanker.encrypt(plaintext);
      const decrypted = await tanker.decrypt(encrypted);
      expect(decrypted).eq(plaintext);
    });

    it('fails to decrypt bad base64', async () => {
      // This kind of basic error handling test is not as trivial as it looks, because there are
      // _many_ kinds of errors in a native module that result in a hang, not an exception (JS promise not resolved)
      await expect(tanker.decrypt('Not base 64!')).eventually.rejectedWith(
        InvalidArgument
      );
    });

    it('encryption options control sharing', async () => {
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
  });
};
