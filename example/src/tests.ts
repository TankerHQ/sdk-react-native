// This file doesn't use jest's expect
/* eslint-disable jest/valid-expect */

import { Tanker } from '@tanker/client-react-native';

import { expect } from 'chai';
import { describe, beforeEach, it } from './framework';
import {
  getAppId,
  getTankerUrl,
  createIdentity,
  createProvisionalIdentity,
  getPublicIdentity,
} from './admin';

export const generateTests = () => {
  describe('Basic tests', () => {
    let tanker: Tanker;
    beforeEach(async () => {
      tanker = new Tanker({
        appId: await getAppId(),
      });
    });

    it('can get a valid version string', async () => {
      expect(tanker.version).to.match(/^2\.\d+\.\d+/);
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
