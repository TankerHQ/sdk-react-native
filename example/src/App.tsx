import * as React from 'react';

import { View, Text, TouchableOpacity } from 'react-native';

import { runTests } from './framework';
import { generateTests } from './tests';

export default function App() {
  const [result, setResult] = React.useState<string | undefined>();

  React.useEffect(() => generateTests(), []);

  const reportUnexpectedError = (e: Error) => {
    console.error('Got an unexpected error:', e.message, "\n", e.stack);
    setResult('UNEXPECTED ERROR ' + e.message);
  }

  const startTests = () => {
    runTests().then(setResult).catch(reportUnexpectedError);
  };

  return (
    <View>
      <TouchableOpacity testID='run_tests' onPress={startTests}>
        <Text>Run the tests</Text>
      </TouchableOpacity>
      <Text testID="result">{result}</Text>
    </View>
  );
}
