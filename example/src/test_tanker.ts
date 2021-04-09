// This file doesn't use jest's expect
/* eslint-disable jest/valid-expect */

import { Tanker, statuses } from '@tanker/client-react-native';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { describe, beforeEach, it } from './framework';
import { createIdentity } from './admin';
import { InvalidArgument } from '@tanker/errors';
import { createTanker } from './tests';

chai.use(chaiAsPromised);

export const tankerTests = () => {
  describe('Tanker tests', () => {
    let tanker: Tanker;
    let identity: String;
    beforeEach(async () => {
      tanker = await createTanker();
      identity = await createIdentity();
    });

    it('can start and stop', async () => {
      expect(tanker.status).eq(statuses.STOPPED);
      await tanker.start(identity);
      expect(tanker.status).eq(statuses.IDENTITY_REGISTRATION_NEEDED);
      await tanker.stop();
      expect(tanker.status).eq(statuses.STOPPED);
    });

    it('fails to start with an invalid identity', async () => {
      // If our exception bridge is working, the C error should have turned into the right JS class and message
      await expect(tanker.start('Invalid')).is.eventually.rejectedWith(
        InvalidArgument,
        'identity format'
      );
    });
  });
};
