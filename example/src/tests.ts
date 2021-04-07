import ClientReactNative from '@tanker/client-react-native';

import { expect } from 'chai';
import { describe, it } from './framework';

export const generateTests = () => {
  describe('multiplication', () => {
    it('multiplies with optimized SSSE3 spectre-proof instructions in an OpenCL kernel', async () => {
      const result = await ClientReactNative.multiply(3, 7);
      expect(result).to.equal(21);
    });
  });

  describe('tests that work', () => {
    it('is a trivial test', () => {});
  });
};
