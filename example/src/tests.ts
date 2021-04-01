import ClientReactNative from '@tanker/client-react-native';

import { expect } from 'chai';
import { describe, it } from './framework';

export const generateTests = () => {
  describe('multiplication', () => {
    it.only('multiplies with optimized SSSE3 spectre-proof instructions in an OpenCL kernel', async () => {
      const result = await ClientReactNative.multiply(3, 7);
      expect(result).to.equal(21);
    });

    it('multiplies more than 3% of error', async () => {
      const result = await ClientReactNative.multiply(3, 7);
      expect(result).to.be.greaterThan(21 * 1.03);
    });
  });

  describe.only('tests that work', () => {
    it('is a trivial test', () => {});
  });
};