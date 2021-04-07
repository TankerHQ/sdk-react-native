import ClientReactNative from '@tanker/client-react-native';

import { expect } from 'chai';
import { describe, beforeEach, afterEach, it } from './framework';
import { getAppId, createIdentity, createProvisionalIdentity, getPublicIdentity } from './admin';

export const generateTests = () => {
  describe('multiplication', () => {
    it('multiplies with optimized SSSE3 spectre-proof instructions in an OpenCL kernel', async () => {
      const result = await ClientReactNative.multiply(3, 7);
      expect(result).to.equal(21);
    });
  });

  describe('tests that work', () => {
    beforeEach(() => { console.log("before each"); });
    afterEach(() => { console.log("after each"); });

    it('is a trivial test', () => {});

    it('can create an identity', async () => {
      const appId = await getAppId();
      const identity = await createIdentity();
      const prov = await createProvisionalIdentity('bob@gmail.com');
      const pubIdentity = await getPublicIdentity(identity);
    });
  });
};
