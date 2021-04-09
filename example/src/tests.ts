import { Tanker } from '@tanker/client-react-native';
import { getAppId, getTankerUrl } from './admin';
import { basicTests } from './test_basic';
import { tankerTests } from './test_tanker';

export const generateTests = () => {
  basicTests();
  tankerTests();
};

export async function createTanker(): Promise<Tanker> {
  const url = await getTankerUrl();
  return new Tanker({
    appId: await getAppId(),
    // @ts-ignore sdkType is not exposed publicly in the API, but the native module will forward it
    sdkType: 'sdk-react-native-test',
    writablePath: ':memory:',
    url,
  });
}
