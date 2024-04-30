import { device, element, waitFor } from 'detox';
import jestExpect from 'expect';
import { TestResult } from '../src/framework';

beforeAll(async () => {
  console.log('Before all: Launching test app');
  await device.launchApp({
    launchArgs: {
      detoxEnableSynchronization: 0,
    },
  });
  await new Promise((r) => setTimeout(r, 500));
  await device.enableSynchronization();
});

const testList = JSON.parse(process.env.ON_DEVICE_TEST_LIST || '');
for (const groupName of Object.keys(testList)) {
  describe(groupName, () => {
    beforeAll(async () => {
      console.log('Before group: Prepare app');
      await device.launchApp({
        newInstance: true,
        launchArgs: {
          detoxEnableSynchronization: 0,
          testGroup: groupName,
        },
      });
      await new Promise((r) => setTimeout(r, 500));
      await device.enableSynchronization();
    });

    beforeEach(async () => {
      await device.reloadReactNative();

      // Desperation: Detox synchronization is extremely flaky
      // Sometimes the scrollView is not loaded yet after a reload
      //await new Promise((r) => setTimeout(r, 500));
    });

    for (const testName of testList[groupName]) {
      it(testName, async () => {
        const fullTestName = `${groupName}_${testName}`;
        const runTestId = `runTest_${fullTestName}`;

        await waitFor(element(by.id(runTestId)))
          .toBeVisible()
          .withTimeout(10000);

        await element(by.id(runTestId)).tap();
        const testResultId = `testResult_${fullTestName}`;
        await waitFor(element(by.id(testResultId)))
          .toExist()
          .withTimeout(5000);
        const attributes = await element(by.id(testResultId)).getAttributes();
        const testResult: TestResult = JSON.parse(
          // @ts-expect-error
          attributes.text || attributes.label
        );

        if (testResult.errorMessage) console.error(testResult.errorMessage);
        jestExpect(testResult.success).toBe(true);
      });
    }
  });
}
