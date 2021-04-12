// This file doesn't use jest's expect
/* eslint-disable jest/valid-expect */

import { Tanker, prehashPassword, statuses } from '@tanker/client-react-native';
import { InvalidArgument, PreconditionFailed } from '@tanker/errors';
import { expect } from 'chai';
import { describe, beforeEach, afterEach, it } from './framework';
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
    afterEach(clearTankerDataDirs);

    it('can get a version string', async () => {
      expect(tanker.version).is.not.empty;
    });

    it('can get the native version string', async () => {
      // Keep this log to help debugging job's output
      console.log(tanker.nativeVersion);
      expect(tanker.nativeVersion).is.not.empty;
    });

    it('has a status', async () => {
      expect(tanker.status).to.equal(statuses.STOPPED);
    });

    it('cannot create Tanker with a bad appId', async () => {
      expect(() => new Tanker({ appId: 'Bad' })).throws(
        InvalidArgument,
        'app_id'
      );
    });

    it('cannot call functions with a stopped device', async () => {
      expect(() => tanker.deviceId).throws(
        PreconditionFailed,
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
      const hash = prehashPassword(password);
      expect(hash).is.not.empty;
      expect(hash).not.eq(password);
    });

    it('prehashPassword should be equal to the test vector', async () => {
      const input = 'super secretive password';
      const output = await prehashPassword(input);
      const b64TestVector = 'UYNRgDLSClFWKsJ7dl9uPJjhpIoEzadksv/Mf44gSHI=';

      expect(output).to.deep.equal(b64TestVector);
    });

    it('should be equal to the unicode test vector', async () => {
      const input = 'test éå 한국어 😃';
      const output = await prehashPassword(input);
      const b64TestVector = 'Pkn/pjub2uwkBDpt2HUieWOXP5xLn0Zlen16ID4C7jI=';

      expect(output).to.deep.equal(b64TestVector);
    });

    it('should throw when given an empty password', async () => {
      await expect(prehashPassword('')).eventually.rejectedWith(
        InvalidArgument,
        'empty password'
      );
    });
  });
};
