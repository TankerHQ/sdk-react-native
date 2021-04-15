import { Tanker } from '@tanker/client-react-native';
import { getAppId, getTankerUrl } from './admin';
import { basicTests } from './test_basic';
import { tankerTests } from './test_tanker';
import { encryptionTests } from './test_encryption';
import { encryptionSessionTests } from './test_encryption_session';
import RNFS from 'react-native-fs';

let pathsToClear: Array<string> = [];

export const generateTests = () => {
  basicTests();
  tankerTests();
  encryptionTests();
  encryptionSessionTests();
};

export async function createTanker(): Promise<Tanker> {
  const url = await getTankerUrl();
  const path = RNFS.DocumentDirectoryPath + '/' + Math.random() + '/';
  await RNFS.mkdir(path);
  pathsToClear.push(path);
  return new Tanker({
    appId: await getAppId(),
    // @ts-ignore sdkType is not exposed publicly in the API, but the native module will forward it
    sdkType: 'sdk-react-native-test',
    writablePath: path,
    url,
  });
}

export async function clearTankerDataDirs(): Promise<void> {
  // RNFS.unlink is not unlink(), it actually rmdirs recursively!
  for (const dir of pathsToClear) {
    await RNFS.unlink(dir);
  }
  pathsToClear = [];
}
