// detox.config.js
// Detox E2E testing configuration

module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'src/tests/e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/PharmaGuide.app',
      build: 'xcodebuild -workspace ios/PharmaGuide.xcworkspace -scheme PharmaGuide -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/PharmaGuide.app',
      build: 'xcodebuild -workspace ios/PharmaGuide.xcworkspace -scheme PharmaGuide -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081]
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
        type: 'iPhone 14'
      }
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_30'
      }
    },
    genymotion: {
      type: 'android.genycloud',
      device: {
        recipeUUID: 'your-genymotion-recipe-uuid'
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
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release'
    },
    'android.attached.debug': {
      device: 'attached',
      app: 'android.debug'
    },
    'android.attached.release': {
      device: 'attached',
      app: 'android.release'
    }
  },
  behavior: {
    init: {
      reinstallApp: true,
      exposeGlobals: false
    },
    launchApp: 'auto',
    cleanup: {
      shutdownDevice: false
    }
  },
  logger: {
    level: process.env.CI ? 'info' : 'debug',
    overrideConsole: true
  },
  artifacts: {
    rootDir: './artifacts',
    pathBuilder: './src/tests/e2e/utils/pathBuilder.js',
    plugins: {
      log: process.env.CI ? 'failing' : 'all',
      screenshot: {
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: process.env.CI,
        takeWhen: {
          testStart: false,
          testDone: true,
          appNotReady: true
        }
      },
      video: process.env.CI ? 'failing' : 'none',
      instruments: {
        enabled: process.env.CI
      },
      timeline: {
        enabled: process.env.CI
      }
    }
  },
  session: {
    server: 'ws://localhost:8099',
    sessionId: 'PharmaGuide'
  }
};
