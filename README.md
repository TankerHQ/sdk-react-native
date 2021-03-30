# Tanker client SDK for React Native

[Tanker](https://tanker.io) provides an easy-to-use SDK allowing you to protect your users' data.

This repository only contains the React Native bindings, which are a thin wrapper around our [Android](https://github.com/TankerHQ/sdk-android) and [iOS](https://github.com/TankerHQ/sdk-ios) bindings.

The core library that underlies our native bindings can be found in the [TankerHQ/sdk-native GitHub project](https://github.com/TankerHQ/sdk-native).

## Installation

```sh
npm install @tanker/client-react-native
```

## Documentation

See the [API documentation](https://docs.tanker.io/latest/api/core/react-native).

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

### Running the test suite on Android

First, compile the Android app:

```sh
cd example
yarn
yarn detox build --configuration android
```

Then, start the application:

```sh
yarn start # This will block your terminal. Test logs will be output by this process, keep an eye on it
```

And the admin server:

```sh
yarn flask # This blocks your terminal too
```

Finally, run the tests:

```sh
yarn detox test --configuration android
```

## License

Apache-2.0
