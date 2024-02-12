import React, { Fragment } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { generateTests } from './tests';
import { getTestList, runTestByName, TestList } from './framework';

import { LaunchArguments } from 'react-native-launch-arguments';
interface DetoxArgs {
  // If set, show only this group of tests in the test UI
  testGroup?: string;
}
const detoxTestGroup = LaunchArguments.value<DetoxArgs>().testGroup;

function isNewArchEnabled(): boolean {
  // @ts-expect-error don't care about the fabric type, just whether it's defined
  return !!global?.nativeFabricUIManager;
}

function App(): React.JSX.Element {
  const [testList, setTestList] = React.useState<TestList>({});
  const [testResultName, setTestResultName] = React.useState<string>('');
  const [testResultValue, setTestResultValue] = React.useState<string>('');

  React.useEffect(() => {
    generateTests();
    setTestList(getTestList());
  }, []);

  return (
    <SafeAreaView>
      <StatusBar barStyle={'dark-content'} />
      <ScrollView testID={'testScrollView'} decelerationRate={0}>
        <View style={styles.container}>
          <View>
            <Text>New arch enabled: {`${isNewArchEnabled()}`}</Text>
          </View>
          {Object.keys(testList)
            .filter(
              (groupName) => !detoxTestGroup || groupName === detoxTestGroup
            )
            .map((groupName) => (
              <Fragment key={'group_' + groupName}>
                <View>
                  <Text style={styles.groupName}>{groupName}</Text>
                  {
                    // @ts-expect-error We know the group is not undefined
                    testList[groupName].map((testName) => (
                      <TouchableOpacity
                        key={'test_' + groupName + '_' + testName}
                        testID={'runTest_' + groupName + '_' + testName}
                        onPress={async () => {
                          console.log('Running ' + testName);
                          const res = await runTestByName(groupName, testName);
                          setTestResultName(groupName + '_' + testName);
                          setTestResultValue(JSON.stringify(res));
                        }}
                      >
                        <Text style={styles.testName}>{testName}</Text>
                      </TouchableOpacity>
                    ))
                  }
                </View>
              </Fragment>
            ))}

          <Text style={styles.section}>JSON data for Detox</Text>
          <View>
            <Text testID={'testListJsonData'} style={styles.finePrint}>
              {JSON.stringify(testList)}
            </Text>
            <Text
              testID={'testResult_' + testResultName}
              style={styles.finePrint}
            >
              {testResultValue}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 20,
  },
  section: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  finePrint: {
    fontSize: 8,
  },
  groupName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  testName: {
    fontSize: 12,
    padding: 0,
    margin: 0,
  },
});

export default App;
