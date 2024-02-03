import { device, element, waitFor } from 'detox';
import { installWorker, uninstallWorker } from 'detox/internals';

async function globalSetup() {
  console.log('Global setup: Installing worker');
  await installWorker({ workerId: 'globalSetupWorker' });
  console.log('Global setup: Listing tests');

  await device.launchApp();
  await waitFor(element(by.id('testListJsonData')))
    .not.toHaveText('')
    .withTimeout(1000);

  const attributes = await element(by.id('testListJsonData')).getAttributes();
  // @ts-expect-error
  const testListJson = attributes.text;
  process.env.ON_DEVICE_TEST_LIST = testListJson;

  await uninstallWorker();

  const testList = JSON.parse(testListJson);
  let numTests = 0;
  for (const groupName in testList) {
    numTests += testList[groupName].length;
  }
  console.log(
    `Found ${numTests} tests in ${Object.keys(testList).length} groups`
  );
}

module.exports = async () => {
  await require('detox/runners/jest').globalSetup();
  await globalSetup();
};
