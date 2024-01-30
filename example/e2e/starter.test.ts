import { device, waitFor } from 'detox';

describe('Basic tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('can get the native version string', async () => {
    await waitFor(element(by.id('nativeVersion')))
      .toHaveText('4.0.0')
      .withTimeout(1000);
  });
});
