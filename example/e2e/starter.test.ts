import { device, element, waitFor } from 'detox';
import jestExpect from 'expect';
import { TestResult } from '../src/framework';

beforeAll(async () => {
  console.log('Before all: Launching test app');
  await device.launchApp();
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
      await device.enableSynchronization();
    });

    beforeEach(async () => {
      await device.reloadReactNative();
    });

    for (const testName of testList[groupName]) {
      it(testName, async () => {
        const fullTestName = `${groupName}_${testName}`;
        const runTestId = `runTest_${fullTestName}`;
        await waitFor(element(by.id(runTestId)))
          .toBeVisible()
          .whileElement(by.id('testScrollView'))
          .scroll(500, 'down');

        await element(by.id(runTestId)).tap();
        const testResultId = `testResult_${fullTestName}`;
        await waitFor(element(by.id(testResultId)))
          .toExist()
          .withTimeout(10000);
        const attributes = await element(by.id(testResultId)).getAttributes();
        // @ts-expect-error
        const testResult: TestResult = JSON.parse(attributes.text);

        if (testResult.errorMessage) console.error(testResult.errorMessage);
        jestExpect(testResult.success).toBe(true);
      });
    }
  });
}
