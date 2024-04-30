import { device, element, waitFor } from 'detox';
import { installWorker, uninstallWorker } from 'detox/internals';

async function globalSetup() {
  console.log('Global setup: Installing worker');
  await installWorker({ workerId: 'globalSetupWorker' });
  console.log('Global setup: Listing tests');

  // With the new architecture, Detox looks for the networking module too early
  // Give the app time to launch, and _then_ enable synchronization,
  // so that RN's OkHttpClient has been initialized when Detox looks for it.
  const detoxArgs = {
    launchArgs: {
      detoxEnableSynchronization: 0,
    },
  };
  await device.launchApp(detoxArgs);

  console.log('Device launched, enabling sync again');
  await new Promise((r) => setTimeout(r, 500));
  await device.enableSynchronization();

  await waitFor(element(by.id('testListJsonData')))
    .not.toHaveText('')
    .withTimeout(1000);

  const attributes = await element(by.id('testListJsonData')).getAttributes();
  // @ts-expect-error
  const testListJson = attributes.text || attributes.label;
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
