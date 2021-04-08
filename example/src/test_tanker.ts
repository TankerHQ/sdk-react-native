// This file doesn't use jest's expect
/* eslint-disable jest/valid-expect */

import { Tanker, statuses } from '@tanker/client-react-native';
import { expect } from 'chai';
import { describe, beforeEach, it } from './framework';
import {
  getAppId,
  getTankerUrl,
  createIdentity,
} from './admin';

export const tankerTests = () => {
  describe('Tanker tests', () => {
    let tanker: Tanker;
    let identity: String;
    beforeEach(async () => {
      const url = await getTankerUrl();
      tanker = new Tanker({
        appId: await getAppId(),
        url,
      });
      identity = await createIdentity();
    });

    it('can start and stop', async () => {
      expect(tanker.status).eq(statuses.STOPPED);
      await tanker.start(identity);
      expect(tanker.status).eq(statuses.IDENTITY_REGISTRATION_NEEDED);
      await tanker.stop();
      expect(tanker.status).eq(statuses.STOPPED);
    });
  });
};
