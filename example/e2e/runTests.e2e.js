/* eslint-env detox/detox, mocha, jest/globals */

describe('Example', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('Wrapper that checks if all tests have passed successfully', async () => {
    await element(by.id('run_tests')).tap();
    await waitFor(element(by.id('result')))
      .toBeVisible()
      .withTimeout(120000);
    // If the following assertion failed, it means at least one test has failed,
    // but you won't find the error message here, read the app's logs.
    await expect(element(by.id('result'))).toHaveText('SUCCESS');
  });
});
