import { Languages } from "../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereUtil", key)(a,b,c,d,e);
}

import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Platform,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
import {eventBus} from "./EventBus";
import {Permissions} from "../backgroundProcesses/PermissionManager";
import {
  enoughCrownstonesForIndoorLocalization,
  enoughCrownstonesInLocationsForIndoorLocalization,
  requireMoreFingerprints
} from "./DataUtil";
const Actions = require('react-native-router-flux').Actions;

export const SphereUtil = {

  getActiveSphere: function(state) {
    let sphereIds = Object.keys(state.spheres);
    let amountOfSpheres = sphereIds.length;

    if (amountOfSpheres === 0) { return { sphereId: null, sphere: null }; }

    let activeSphereId = state.app.activeSphere;
    if (!activeSphereId) { activeSphereId = sphereIds[0]; }
    let activeSphere = state.spheres[activeSphereId];

    if (!activeSphere) { return { sphereId: null, sphere: null }; }

    return { sphereId: activeSphereId, sphere: activeSphere }
  },


  getPresentSphere: function(state) {
    let sphereIds = Object.keys(state.spheres);

    for (let i = 0; i < sphereIds.length; i++) {
      if (state.spheres[sphereIds[i]].state.present) {
        return { sphereId: sphereIds[i], sphere: state.spheres[sphereIds[i]] };
      }
    }

    return { sphereId: null, sphere: null };
  },


  getAmountOfPresentSpheres: function(state) : number {
    let sphereIds = Object.keys(state.spheres);
    let amountOfSpheres = sphereIds.length;

    if (amountOfSpheres === 0) { return 0; }

    let amountOfPresentSpheres = 0;
    for (let i = 0; i < sphereIds.length; i++) {
      if (state.spheres[sphereIds[i]].state.present) {
        amountOfPresentSpheres += 1;
      }
    }

    return amountOfPresentSpheres;
  },

  getTimeLastSeenInSphere: function(state, sphereId) {
    let stones = state.spheres[sphereId].stones;
    let stoneIds = Object.keys(stones);
    let timeLastSeen = 0;
    stoneIds.forEach((stoneId) => {
      // get the most recent time.
      if (stones[stoneId].reachability.lastSeen) {
        timeLastSeen = Math.max(timeLastSeen, stones[stoneId].reachability.lastSeen);
      }
    });

    return timeLastSeen > 0 ? timeLastSeen : null
  },

  finalizeLocalizationData: function(state) {
    let { sphereId, sphere } = SphereUtil.getActiveSphere(state);

    if (sphereId === null) { return { showItem: false, action: () => {} } }

    let sphereIsPresent = sphere.state.present;

    // are there enough in total?
    let enoughCrownstonesForLocalization = enoughCrownstonesForIndoorLocalization(state, sphereId);

    // do we need more fingerprints?
    let requiresFingerprints = requireMoreFingerprints(state, sphereId);

    let noRooms = (sphereId ? Object.keys(sphere.locations).length : 0) == 0;

    let spherePermissions = Permissions.inSphere(sphereId);

    let showFinalizeIndoorNavigationButton = (
      state.app.indoorLocalizationEnabled &&
      spherePermissions.doLocalizationTutorial &&
      sphereIsPresent === true && // only show this if you're there.
      enoughCrownstonesForLocalization === true && // Have 4 or more crownstones
      (noRooms === true || requiresFingerprints === true)  // Need more fingerprints.
    );

    let showFinalizeIndoorNavigationCallback = () => {
      if (!sphereIsPresent) {
        Alert.alert(
          lang("Youll_have_to_be_in_the_S"),
          lang("If_youre_in_range_of_any_"),
          [{text: 'OK'}]
        );
      }
      else if (noRooms) {
        Alert.alert(
          lang("Lets_create_some_rooms_"),
          lang("Tap_the_icon_on_the_botto"),
          [{text: 'OK'}]
        );
      }
      else if (enoughCrownstonesInLocationsForIndoorLocalization(state, sphereId)) {
        eventBus.emit("showLocalizationSetupStep2", sphereId);
      }
      else {
        Actions.roomOverview({
          sphereId: sphereId,
          locationId: null,
          title: lang("First_things_first___"),
          hideRight: true,
          usedForIndoorLocalizationSetup: true,
          overlayText: lang("Place_your_Crownstones_in"),
          explanation: lang("Tap_a_Crownstone_to_see_i")
        });
      }
    };

    return {
      showItem: showFinalizeIndoorNavigationButton,
      action: showFinalizeIndoorNavigationCallback
    }

  },

  newMailAvailable: function(state) {
    let { sphereId, sphere } = SphereUtil.getActiveSphere(state);
    if (sphereId && sphere) {
      return sphere.state.newMessageFound
    }
    return false;
  }

}