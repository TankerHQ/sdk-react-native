# @tanker/client-react-native

Tanker client SDK for React Native

## Installation

```sh
npm install @tanker/client-react-native
```

## Tests

First, compile the Android app:

```sh
cd example
yarn
yarn detox build --configuration android
```

Then, start the application:

```sh
yarn start # This will block your terminal. Test logs will be spit by this process, keep an eye on it
```

Finally, run the tests:

```sh
yarn detox test --configuration android
```

## Usage

```js
import ClientReactNative from "@tanker/client-react-native";

// ...

const result = await ClientReactNative.multiply(3, 7);
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
