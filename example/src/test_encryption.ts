import type { Tanker } from '@tanker/client-react-native';
import { Padding } from '@tanker/client-react-native';
import { expect, describe, beforeEach, afterEach, it } from './framework';
import { createIdentity, getPublicIdentity } from './admin';
import { InvalidArgument } from '@tanker/errors';
import { createTanker, clearTankerDataDirs, getPaddedSize } from './tests';

const simpleEncryptionOverhead = 49;
const simpleEncryptionPaddedOverhead = simpleEncryptionOverhead + 1;

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

    it('roundtrips a basic encrypt', async () => {
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

    it('uses encryption options to share', async () => {
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
        'key not found'
      );

      expect(decrypted).eq(plaintext);
    });

    it('roundtrips with encryptData', async () => {
      const plaindata = 'dW5kZXIgY29vbCBtb29ubGlnaHQ=';
      const encrypted = await tanker.encryptData(plaindata);
      const decrypted = await tanker.decryptData(encrypted);
      expect(decrypted).eq(plaindata);
    });

    it('fails to pass a non-base64 plaintext to encryptData', async () => {
      // NOTE: Android cannot be told to reject unpadded Base64 (though if there is padding, it must be correct),
      // that's why we explicitely pick a plaintext with a space (invalid charset) for this test
      const plaintext = 'plain text';
      await expect(tanker.encryptData(plaintext)).eventually.rejectedWith(
        InvalidArgument
      );
    });

    it('encryptData correctly un-base64-ifies before encrypt', async () => {
      const plaindata = 'ZmlyZQ==';
      const plaintext = 'fire';

      // When we decrypt as a _string_ something encrypted as a _binary_, so the native module will try decoding the
      // decrypted data as UTF-8. plaindata happens to be a string, so we get to observe if its behavior is correct
      const encrypted = await tanker.encryptData(plaindata);
      const decrypted = await tanker.decrypt(encrypted);
      expect(decrypted).eq(plaintext);
    });

    it('retrieves the resourceId for a small encrypted data', async () => {
      const encrypted = await tanker.encrypt('Principalities');
      const resId = await tanker.getResourceId(encrypted);
      expect(resId).is.not.empty;
    });

    it('retrieves the resourceId for a longer encrypted data', async () => {
      const plaintext = `Heap dump: 0x${'41'.repeat(1025)}`;
      const encrypted = await tanker.encrypt(plaintext);
      const resId = await tanker.getResourceId(encrypted);
      expect(resId).is.not.empty;
    });

    it('shares encrypted data', async () => {
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

    it('encrypts with auto padding by default', async () => {
      const plaintext = 'my clear data is clear!';
      const lengthWithPadme = 24;

      const encrypted = await tanker.encrypt(plaintext);

      const paddedSize = getPaddedSize(
        encrypted,
        simpleEncryptionPaddedOverhead
      );
      expect(paddedSize).eq(lengthWithPadme);

      const decrypted = await tanker.decrypt(encrypted);
      expect(decrypted).eq(plaintext);
    });

    it('encrypts with auto padding', async () => {
      const plaintext = 'my clear data is clear!';
      const lengthWithPadme = 24;

      const options = { paddingStep: Padding.AUTO };
      const encrypted = await tanker.encrypt(plaintext, options);

      const paddedSize = getPaddedSize(
        encrypted,
        simpleEncryptionPaddedOverhead
      );
      expect(paddedSize).eq(lengthWithPadme);

      const decrypted = await tanker.decrypt(encrypted);
      expect(decrypted).eq(plaintext);
    });

    it('encrypts with no padding', async () => {
      const plaintext = 'This is the text to pad.';

      const options = { paddingStep: Padding.OFF };
      const encrypted = await tanker.encrypt(plaintext, options);

      const paddedSize = getPaddedSize(encrypted, simpleEncryptionOverhead);
      expect(paddedSize).to.equal(plaintext.length);

      const decrypted = await tanker.decrypt(encrypted);
      expect(decrypted).eq(plaintext);
    });

    it('encrypts with a padding step', async () => {
      const plaintext = 'my clear data is clear';

      const step = 13;
      const options = { paddingStep: step };
      const encrypted = await tanker.encrypt(plaintext, options);

      const paddedSize = getPaddedSize(
        encrypted,
        simpleEncryptionPaddedOverhead
      );
      expect(paddedSize % step).to.equal(0);

      const decrypted = await tanker.decrypt(encrypted);
      expect(decrypted).eq(plaintext);
    });

    it('fails to provide a bad paddingStep parameter', async () => {
      const plaintext = 'unused';
      await Promise.all(
        [-1, 0, 1, 2.42, 'a random string', null].map(async (x) => {
          await expect(
            // @ts-expect-error
            tanker.encrypt(plaintext, { paddingStep: x })
          ).eventually.rejectedWith(InvalidArgument);
        })
      );
    });
  });
};
