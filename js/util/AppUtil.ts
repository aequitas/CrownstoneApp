import { Languages } from "../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AppUtil", key)(a, b, c, d, e);
}

import { Alert, Platform }       from 'react-native';
import { StoreManager }          from '../router/store/storeManager'
import { BluenetPromiseWrapper } from '../native/libInterface/BluenetPromise'
import { Bluenet }               from '../native/libInterface/Bluenet';
import { eventBus }              from './EventBus';
import {LOG, LOGe} from "../logging/Log";
import { Actions } from "react-native-router-flux";
import {NativeBus} from "../native/libInterface/NativeBus";
import {CLOUD} from "../cloud/cloudAPI";
import {Util} from "./Util";
import { Sentry } from "react-native-sentry";
import {Scheduler} from "../logic/Scheduler";

export const AppUtil = {
  quit: function() {
    Bluenet.quitApp();
  },

  resetBle: function() {
    if (Platform.OS === 'android') {
      Bluenet.resetBle();
    }
  },

  resetDatabase(store, eventBus) {
    eventBus.emit("showLoading", lang("Preparing_for_download___"))
    let clearDB = () => {
      eventBus.clearMostEvents();
      NativeBus.clearAllEvents();
      Scheduler.reset();

      eventBus.emit("showLoading", lang("Clearing_database___"));

      let state = store.getState();
      let sphereIds = Object.keys(state.spheres);
      let actions = [];

      sphereIds.forEach((sphereId) => {
        actions.push({__purelyLocal: true, __noEvents: true, type:"REMOVE_SPHERE", sphereId: sphereId});
      })

      actions.push({__purelyLocal: true, __noEvents: true, type:'RESET_APP_SETTINGS'})

      store.batchDispatch(actions);
      eventBus.emit("showLoading", lang("Getting_new_data___"))
      CLOUD.__syncTriggerDatabaseEvents = false;
      CLOUD.sync(store)
        .then(() => {
          eventBus.emit("showLoading", lang("Finalizing___"));
          return new Promise((resolve, reject) => {
            setTimeout(() => { eventBus.emit("showLoading", lang("App_will_close_in___secon",5)); }, 1000);
            setTimeout(() => { eventBus.emit("showLoading", lang("App_will_close_in___secon",4)); }, 2000);
            setTimeout(() => { eventBus.emit("showLoading", lang("App_will_close_in___secon",3)); }, 3000);
            setTimeout(() => { eventBus.emit("showLoading", lang("App_will_close_in___secon",2)); }, 4000);
            setTimeout(() => { eventBus.emit("showLoading", lang("App_will_close_in___secon",1)); }, 5000);
            setTimeout(() => { Bluenet.quitApp(); resolve(true); }, 6000)
          })
        })
        .catch((err) => {
          eventBus.emit("showLoading", "Falling back to full clean...");
          return StoreManager.destroyActiveUser()
        })
        .then((success) => {
          if (!success) {
            setTimeout(() => { eventBus.emit("showLoading", lang("App_will_close_in___secon",5)); }, 1000);
            setTimeout(() => { eventBus.emit("showLoading", lang("App_will_close_in___secon",4)); }, 2000);
            setTimeout(() => { eventBus.emit("showLoading", lang("App_will_close_in___secon",3)); }, 3000);
            setTimeout(() => { eventBus.emit("showLoading", lang("App_will_close_in___secon",2)); }, 4000);
            setTimeout(() => { eventBus.emit("showLoading", lang("App_will_close_in___secon",1)); }, 5000);
            setTimeout(() => { Bluenet.quitApp(); }, 6000)
          }
        })
        .catch((err) => {
          Alert.alert(lang("Data_reset_failed___"), lang("Something_went_wrong_in_t"),[{text: lang("OK")}])
        })
    }

    if (CLOUD.__currentlySyncing) {
      let unsub = eventBus.on('CloudSyncComplete', () => {
        setTimeout(() => { unsub(); clearDB(); }, 200);
      })
    }
    else {
      clearDB();
    }
  },


  logOut: function(store, message = null) {
    if (message) {
      Alert.alert(message.title, message.body, [{text:'OK', onPress:() => {
        AppUtil._logOut(store, () => {Bluenet.quitApp();});
      }}], { cancelable: false });
    }
    else {
      let gracefulExit = () => {
        LOG.info("Quit app due to logout");
        setTimeout(() => {
          Bluenet.quitApp();
        }, 3500);
      };

      AppUtil._logOut(store, gracefulExit);
    }
  },

  _logOut: function(store, gracefulExit) {

    Sentry.captureBreadcrumb({
      category: 'logout',
      data: {
        state:'startLogOut'
      }
    });
    // TODO: Wait for possibly pending sync to stop
    eventBus.emit("showLoading", {text:lang("Logging_out_and_closing_a"), opacity:0.25});

    // clear position for this device.
    let state = store.getState();
    let deviceId = Util.data.getCurrentDeviceId(state);
    Actions.logout();

    // clear all events listeners, should fix a lot of redraw issues which will crash at logout
    eventBus.clearAllEvents();
    NativeBus.clearAllEvents();

    // sign out of all spheres.
    let sphereIds = Object.keys(state.spheres);
    sphereIds.forEach((sphereId) => {
      store.dispatch({type: 'SET_SPHERE_STATE', sphereId: sphereId, data: {reachable: false, present: false}});
    });

    BluenetPromiseWrapper.clearTrackedBeacons().catch(() => {});
    Bluenet.stopScanning();
    CLOUD.forDevice(deviceId).exitSphere("*")  // will also clear location
      .catch(() => {})
      .then(() => {
        return StoreManager.userLogOut()
      })
      .then(() => {
        LOG.info("Quit app due to logout.");
        gracefulExit();
      })
      .catch((err) => {
        LOGe.info("Could not log user out!", err);
        gracefulExit();
      });
  },
};