/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
      reportSpecs: true,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Debug-iphonesimulator/ClientReactNativeExample.app',
      build:
        'xcodebuild -workspace ios/ClientReactNativeExample.xcworkspace -scheme ClientReactNativeExample -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Release-iphonesimulator/ClientReactNativeExample.app',
      build:
        'xcodebuild -workspace ios/ClientReactNativeExample.xcworkspace -scheme ClientReactNativeExample -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build:
        'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },
  devices: {
    simulator_ios_latest: {
      type: 'ios.simulator',
      device: {
        os: '17.4',
        type: 'iPhone 15',
      },
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*',
      },
    },
    emulator_x86_64_oldest: {
      type: 'android.emulator',
      device: {
        avdName: 'system-images-android-23-google_apis-x86_64',
      },
    },
    emulator_x86_64_latest: {
      type: 'android.emulator',
      device: {
        avdName: 'system-images-android-34-google_apis-x86_64',
      },
    },
    emulator_armv8_oldest: {
      type: 'android.emulator',
      device: {
        avdName: 'system-images-android-23-google_apis-arm64-v8a',
      },
    },
    emulator_armv8_latest: {
      type: 'android.emulator',
      device: {
        avdName: 'system-images-android-34-google_apis-arm64-v8a',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator_ios_latest',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator_ios_latest',
      app: 'ios.release',
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug',
    },
    'android.att.release': {
      device: 'attached',
      app: 'android.release',
    },
    'android.emu.x86_64.latest.debug': {
      device: 'emulator_x86_64_latest',
      app: 'android.debug',
    },
    'android.emu.x86_64.oldest.debug': {
      device: 'emulator_x86_64_oldest',
      app: 'android.debug',
    },
    'android.emu.x86_64.latest.release': {
      device: 'emulator_x86_64_latest',
      app: 'android.release',
    },
    'android.emu.x86_64.oldest.release': {
      device: 'emulator_x86_64_oldest',
      app: 'android.release',
    },
    'android.emu.armv8.oldest.debug': {
      device: 'emulator_armv8_oldest',
      app: 'android.debug',
    },
    'android.emu.armv8.latest.debug': {
      device: 'emulator_armv8_latest',
      app: 'android.debug',
    },
    'android.emu.armv8.oldest.release': {
      device: 'emulator_armv8_oldest',
      app: 'android.release',
    },
    'android.emu.armv8.latest.release': {
      device: 'emulator_armv8_latest',
      app: 'android.release',
    },
  },
};
