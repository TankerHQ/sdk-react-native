import {
  Tanker,
  Status,
  prehashPassword,
  prehashAndEncryptPassword,
  errors,
} from '@tanker/client-react-native';
import { expect, describe, beforeEach, afterEach, it } from './framework';
import { createTanker, clearTankerDataDirs } from './tests';
import {
  getAppId,
  createIdentity,
  createProvisionalIdentity,
  getPublicIdentity,
} from './admin';

export const basicTests = () => {
  describe('Basic tests', () => {
    let tanker: Tanker;
    beforeEach(async () => {
      tanker = await createTanker();
    });
    afterEach(async () => {
      await tanker.stop();
      await clearTankerDataDirs();
    });

    it('can get a version string', async () => {
      expect(Tanker.version).is.not.empty;
    });

    it('can get the native version string', async () => {
      // Keep this log to help debugging job's output
      console.log(tanker.nativeVersion);
      expect(tanker.nativeVersion).is.not.empty;
    });

    it('has a status', async () => {
      expect(tanker.status).to.equal(Status.STOPPED);
    });

    it('cannot create Tanker with a bad appId', async () => {
      expect(() => new Tanker({ appId: 'Bad' })).throws(
        errors.InvalidArgument,
        'app_id'
      );
    });

    it('cannot call functions with a stopped device', async () => {
      await expect(tanker.encrypt('test')).eventually.rejectedWith(
        errors.PreconditionFailed,
        'session status'
      );
    });

    it('can create an identity', async () => {
      const appId = await getAppId();
      expect(appId).is.not.empty;
      const identity = await createIdentity();
      const prov = await createProvisionalIdentity('bob@gmail.com');
      expect(prov).is.not.empty;
      const pubIdentity = await getPublicIdentity(identity);
      expect(pubIdentity).is.not.empty;
    });

    it('prehashPassword does something', async () => {
      const password = 'Amiral de bateau-lavoir';
      const hash = await prehashPassword(password);
      expect(typeof hash).eq('string');
      expect(hash).is.not.empty;
      expect(hash).not.eq(password);
    });

    it('prehashPassword should be equal to the test vector', async () => {
      const input = 'super secretive password';
      const output = await prehashPassword(input);
      const b64TestVector = 'UYNRgDLSClFWKsJ7dl9uPJjhpIoEzadksv/Mf44gSHI=';

      expect(output).to.deep.equal(b64TestVector);
    });

    it('prehashPassword should be equal to the unicode test vector', async () => {
      const input = 'test éå 한국어 😃';
      const output = await prehashPassword(input);
      const b64TestVector = 'Pkn/pjub2uwkBDpt2HUieWOXP5xLn0Zlen16ID4C7jI=';

      expect(output).to.deep.equal(b64TestVector);
    });

    it('prehashPassword should throw when given an empty password', async () => {
      await expect(prehashPassword('')).eventually.rejectedWith(
        errors.InvalidArgument,
        'empty password'
      );
    });

    it('prehashAndEncryptPassword fails to hash an empty password', async () => {
      const publicKey = 'iFpHADRaRYQbErZhHMDruROvqkRF3XkgJxKk+7eP1hI=';
      await expect(
        prehashAndEncryptPassword('', publicKey)
      ).eventually.rejectedWith(errors.InvalidArgument);
    });

    it('prehashAndEncryptPassword fails to hash an empty public key', async () => {
      const password = 'super secretive password';
      await expect(
        prehashAndEncryptPassword(password, '')
      ).eventually.rejectedWith(errors.InvalidArgument);
    });

    it('prehashAndEncryptPassword fails to hash a non-base64-encoded public key', async () => {
      const password = 'super secretive password';
      await expect(
        prehashAndEncryptPassword(password, '$')
      ).eventually.rejectedWith(errors.InvalidArgument);
    });

    it('prehashAndEncryptPassword fails to hash with an invalid public key', async () => {
      const password = 'super secretive password';
      await expect(
        prehashAndEncryptPassword(password, 'fake')
      ).eventually.rejectedWith(errors.InvalidArgument);
    });

    it('prehashAndEncryptPassword hashes and encrypt when using a valid password and public key', async () => {
      const password = 'super secretive password';
      const publicKey = 'iFpHADRaRYQbErZhHMDruROvqkRF3XkgJxKk+7eP1hI=';
      const hash = await prehashAndEncryptPassword(password, publicKey);
      expect(typeof hash).eq('string');
      expect(hash).not.empty;
      expect(hash).not.contain(password);
    });
  });
};
