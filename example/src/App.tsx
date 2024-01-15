import { Tanker } from '@tanker/client-react-native';

import React from 'react';
import type { PropsWithChildren } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import base64 from 'react-native-base64';

import { Colors, Header } from 'react-native/Libraries/NewAppScreen';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({ children, title }: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

function createTanker(): Tanker {
  return new Tanker({
    appId: 'Po70RWAIAzUoXsYBb+GV8gEJN1snXOuC+wY0BofQMTM=',
    // @ts-ignore sdkType is not exposed publicly in the API, but the native module will forward it
    sdkType: 'sdk-react-native-test',
    url: 'https://dev-api.tanker.io',
  });
}

async function startTanker(): Promise<Tanker> {
  let tanker = createTanker();

  const ident =
    'eyJkZWxlZ2F0aW9uX3NpZ25hdHVyZSI6ImNlNUdCQ0drcHhOb29kdTYrNkZJd2NqU1pjd1NPY1ZBZVBsQ1grYlFDRGRLTHBGNmp4Q0FYQnFBRHV4dm1UUEtTdEF2cTNtdHNwSm9KbmFJTTF4dUFnPT0iLCJlcGhlbWVyYWxfcHJpdmF0ZV9zaWduYXR1cmVfa2V5IjoiN2h3N3BFMmlac2UzUUpaaVBsd09ORThIVzQ3TS9wWkl1RDlENzNRMVc0M3M3V3RaVGN2ZTlPYlBXN0lJVmtid1ptRzlCdG9sYzVnQ0pHcm54NUI5SHc9PSIsImVwaGVtZXJhbF9wdWJsaWNfc2lnbmF0dXJlX2tleSI6IjdPMXJXVTNMM3ZUbXoxdXlDRlpHOEdaaHZRYmFKWE9ZQWlScTU4ZVFmUjg9IiwidGFyZ2V0IjoidXNlciIsInRydXN0Y2hhaW5faWQiOiJQbzcwUldBSUF6VW9Yc1lCYitHVjhnRUpOMXNuWE91Qyt3WTBCb2ZRTVRNPSIsInVzZXJfc2VjcmV0IjoiamtQekhDYU5rckc1MGo2eGxLU1RialhHTG94MTNBTXhXYnU3Wit5MWFYej0iLCJ2YWx1ZSI6IjNZMzY0bzZGa05VdDdTV2QvVHNYbjM4L3FhVjR1RmtiK1lZajA2OUNiS0k9In0=';
  const status = await tanker.start(ident);
  console.log('Tanker started');

  if (status === Tanker.statuses.IDENTITY_REGISTRATION_NEEDED) {
    await tanker.registerIdentity({ passphrase: '12345' });
    console.log('Registered identity');
  } else if (status === Tanker.statuses.IDENTITY_VERIFICATION_NEEDED) {
    await tanker.verifyIdentity({ passphrase: '12345' });
    console.log('Verified identity');
  } else if (status === Tanker.statuses.READY) {
    console.log('Device ready');
  }
  return tanker;
}

async function testEncrypt(tanker: Tanker): Promise<string> {
  return base64.encode(await tanker.encrypt('Hello, world!'));
}

function isNewArchEnabled(): boolean {
  // @ts-expect-error don't care about its type, just whether it's defined
  return !!global?.nativeFabricUIManager;
}

function App(): React.JSX.Element {
  const [encryptResult, setEncryptResult] = React.useState<
    string | undefined
  >();
  const [decryptResult, setDecryptResult] = React.useState<
    string | undefined
  >();

  React.useEffect(() => {
    startTanker().then(async (tanker) => {
      const encrypted = await testEncrypt(tanker);
      await setEncryptResult(encrypted);
      const decrypted = await tanker.decrypt(base64.decode(encrypted));
      await setDecryptResult(decrypted);
    });
  }, []);

  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    height: '100%',
    backgroundColor: isDarkMode ? Colors.black : Colors.white,
  };
  const smallText = {
    fontSize: 10,
  };

  return (
    <SafeAreaView>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}
        >
          <Section title="We're so back">
            New arch enabled: {isNewArchEnabled() + '\n'}
            Native version: {createTanker().nativeVersion + '\n'}
            {'\n'}
            Encrypted: <Text style={smallText}>{encryptResult + '\n'}</Text>
            Decrypted: {decryptResult + '\n'}
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
