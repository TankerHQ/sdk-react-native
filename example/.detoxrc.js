/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/ClientReactNativeExample.app',
      build: 'xcodebuild -workspace ios/ClientReactNativeExample.xcworkspace -scheme ClientReactNativeExample -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/ClientReactNativeExample.app',
      build: 'xcodebuild -workspace ios/ClientReactNativeExample.xcworkspace -scheme ClientReactNativeExample -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [
        8081
      ]
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15'
      }
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*'
      }
    },
    emulator_x86_64: {
      type: 'android.emulator',
      device: {
        avdName: 'system-images-android-33-google_apis-x86_64'
      }
    },
    emulator_armv8: {
      type: 'android.emulator',
      device: {
        avdName: 'system-images-android-33-google_apis-arm64-v8a'
      }
    }
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug'
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release'
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug'
    },
    'android.att.release': {
      device: 'attached',
      app: 'android.release'
    },
    'android.emu.x86_64.debug': {
      device: 'emulator_x86_64',
      app: 'android.debug'
    },
    'android.emu.x86_64.release': {
      device: 'emulator_x86_64',
      app: 'android.release'
    },
    'android.emu.armv8.debug': {
      device: 'emulator_armv8',
      app: 'android.debug'
    },
    'android.emu.armv8.release': {
      device: 'emulator_armv8',
      app: 'android.release'
    }
  }
};
