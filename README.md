# iOS & Android App for the Crownstone.

## State

The Crownstone iOS and Android apps have the following functionality:

| Functionality                                   | State Firmware           | State Smartphone Apps     | 
| ---                                             | ---                      | ---                       |
| Switching                                       | Done                     | Done                      |
| Instantaneous power consumption                 | Done                     | Done                      |
| Reacting on close proximity (tap-to-toggle)     | Done                     | Done                      |
| Reacting on moderate proximity (presence)       | Done                     | Done                      |
| Reacting on room-level indoor positioning       | Done                     | Done                      |
| User-controlled upload of data to the cloud     | Done                     | Done                      |
| Sending commands through the internet           | Done                     | Done                      |
| Visualizing other users in the app              | Done                     | Done                      |
| Scheduling                                      | Done                     | Done                      |
| Wake-up light                                   | To be done               | To be done                |
| Dimming (synced PWM at 100Hz)                   | To be done               | To be done                |
| Power consumption history                       | To be done               | To be done                |
| Integration with Toon                           | To be done               | To be done                |
| Device identification                           | To be done               | To be done                |
| Control by non-registered guest users           | To be done               | To be done                |
| Integration with thermostat radiator valves     | To be done               | To be done                |
| Multi-user setup (don't leave user in the dark) | To be done               | To be done                |

The roadmap of the software development can be found at [Trello](https://trello.com/b/6rUcIt62/crownstone-transparent-product-roadmap).

The Android development is always a few weeks behind the iOS development, especially with respect to the graphical user interface. 

The application makes use of separate libraries (so-called bluenet libraries) that are native to the platform. 
This is on purpose so that people can be make use of the Crownstone libraries without the need to use React Native.
See below for getting the libraries.

## Issues and feature requests

Do you encounter some issues or would you like to see a particular feature, file them directly at our [Github issues tracker](https://github.com/crownstone/CrownstoneApp/issues).

## Download

The compiled app can be downloaded from [Crownstone](https://crownstone.rocks/app/). 

<img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_welcome.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_login.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_preferences.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_power_use.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_power_use2.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_plug_on.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_pick_icon.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_overview_start.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_overview4.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_floating.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_fingerprinting.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_dfu.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_behaviour3.jpg" width="196px" height="348px"/><img src="https://raw.githubusercontent.com/crownstone/CrownstoneApp/master/screenshots/screenshot_behaviour2.jpg" width="196px" height="348px"/>

## Setup

### React Native

Make copies of ./js/LocalConfig.template.js and ./sentrySettings.template.js and rename them to ./js/LocalConfig.js and ./sentrySettings.js.

Assuming you've already installed npm, nodejs and yarn. You can get Yarn here: https://yarnpkg.com/en/docs/install
* nodejs
* Yarn, can be obtained at [yarnpkg.com](https://yarnpkg.com/en/docs/install).
* Carthage (for iOS)
* Android Studio (for Android)

Make sure typescript 2.2 or higher is installed using:

```
npm install -g typescript
```

To download all dependencies, use Yarn:

```
yarn
```

To run the compiler, use:

```
tsc --watch
```

or

```
npm start
```


### iOS

In the ios folder, use Carthage to download the dependencies.

```
carthage bootstrap --platform iOS --no-use-binaries
```

### Android

1. Get the nodejs modules:

        yarn

2. Clone the bluenet lib for android to another dir, and copy the `bluenet` module to the `android` dir of the app:

        cd ..
        git clone https://github.com/crownstone/bluenet-android-lib.git
        cp -r bluenet-android-lib/bluenet CrownstoneApp/android
        cd CrownstoneApp

2. Import the project in Android Studio

        File > New > Import Project ...

    Choose the android dir.


## Commands

Run the tests:

```
npm test
```

Run react-native

```
react-native run-ios
```

or:
```
react-native run-android
```

## Troubleshooting

If there are problems with PHC folders during iOS compilation, remove the build folder in the ios map.
Cameraroll has to be manually added to iosbuild in 0.42


If you get a lot of these messages in the XCode console:
```
__nw_connection_get_connected_socket_block_invoke
```

Add this global variable to your build config:
```
Xcode menu -> Product -> Edit Scheme...
Environment Variables -> Add -> Name: "OS_ACTIVITY_MODE", Value:"disable"
```


If you get a compilation issues in xcode 10,
"config.h not found"
copy the ios-configure-glog.sh from /node_modules/react-native/scripts to /node_modules/react-native/thirdParty/glog and run the script. Clean and rebuild


If you get libfishhook.a is missing, go to RTCWebSocket and re-add the libfishhook.a in the link binary with libraries panel.

react-transform-hmr errors: run this to start the server --> react-native start  --reset-cache

## Copyrights

The copyrights (2014-2017) belongs to the team of Crownstone B.V. and are provided under an noncontagious open-source license:

* Authors: Alex de Mulder, Bart van Vliet
* Date: 1 Apr. 2016
* Triple-licensed: LGPL v3+, Apache, MIT
* Crownstone B.V., <https://www.crownstone.rocks>
* Rotterdam, The Netherlands

