// This file doesn't use jest's expect
/* eslint-disable jest/valid-expect */

import Tanker from '@tanker/client-react-native';

import { expect } from 'chai';
import { describe, it } from './framework';
import {
  getAppId,
  getTankerUrl,
  createIdentity,
  createProvisionalIdentity,
  getPublicIdentity,
} from './admin';

export const generateTests = () => {
  describe('Basic tests', () => {
    it('can get a valid version string', async () => {
      expect(Tanker.version).to.match(/^2\.\d+\.\d+/);
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
  });
};
