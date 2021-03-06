import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereOverview", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;
import { SetupStateHandler }        from '../../native/setup/SetupStateHandler'
import { AnimatedBackground }       from '../components/animated/AnimatedBackground'
import { Icon }                     from '../components/Icon'
import { Sphere }                   from './Sphere'
import { LOG }                      from '../../logging/Log'
import { availableScreenHeight, colors, OrangeLine, overviewStyles, screenHeight, screenWidth } from "../styles";
import { DfuStateHandler }          from "../../native/firmware/DfuStateHandler";
import { Permissions}               from "../../backgroundProcesses/PermissionManager";
import { FinalizeLocalizationIcon } from "../components/FinalizeLocalizationIcon";
import { TopbarButton, TopbarLeftButton } from "../components/topbar/TopbarButton";
import { AlternatingContent }       from "../components/animated/AlternatingContent";
import { topBarStyle }              from "../components/topbar/TopbarStyles";
import { SphereChangeButton }       from "./buttons/SphereChangeButton";
import { AddItemButton }            from "./buttons/AddItemButton";
import { SphereUtil }               from "../../util/SphereUtil";
import {SphereLevel}                from "./SphereLevel";
import {ZoomInstructionOverlay}     from "./ZoomInstructionOverlay";
import {Util} from "../../util/Util";


const ZOOM_LEVELS = {
  sphere: 'sphere',
  room: 'room'
}

export class SphereOverview extends LiveComponent<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    if (params === undefined) { return }

    let paramsToUse = params;
    if (!params.title) {
      if (NAVBAR_PARAMS_CACHE !== null) {
        paramsToUse = NAVBAR_PARAMS_CACHE;
      }
      else {
        paramsToUse = getNavBarParams(params.store.getState(), params, {});
      }
    }

    let returnData = {
      title: paramsToUse.title,
      headerRight: paramsToUse.rightLabel ? <TopbarButton text={paramsToUse.rightLabel} onPress={paramsToUse.rightAction} item={paramsToUse.rightItem} /> : undefined,
      headerTruncatedBackTitle: lang("Back"),
      // headerTitle: <Component /> // used to insert custom header Title component
      // headerLeft:  <Component /> // used to insert custom header Title component
      // headerBackImage: require("path to image") // customize back button image

    }

    if (paramsToUse.showFinalizeNavigationButton || paramsToUse.showMailIcon) {
      let headerLeft = null
      if (Platform.OS === 'android') {
        let contentArray = [];

        if (paramsToUse.showFinalizeNavigationButton) { contentArray.push(<FinalizeLocalizationIcon />); }
        if (paramsToUse.showMailIcon)                 { contentArray.push(<Icon name='md-mail' size={27} style={{color:colors.white.hex}} />); }
        contentArray.push(<Icon name="md-menu" size={27} color={colors.white.hex} />);

        headerLeft = (
          <AlternatingContent
            style={topBarStyle.topBarLeftTouch}
            fadeDuration={500}
            switchDuration={2000}
            onPress={() => { Actions.drawerOpen(); }}
            contentArray={contentArray}
          />
        );
      }
      else {
        headerLeft = <TopbarLeftButton item={<FinalizeLocalizationIcon />} onPress={paramsToUse.showFinalizeIndoorNavigationCallback} />
      }

      returnData["headerLeft"] = headerLeft
    }

    return returnData;
  };

  unsubscribeSetupEvents : any;
  unsubscribeStoreEvents : any;

  constructor(props) {
    super(props);

    this.state = { zoomLevel: ZOOM_LEVELS.room, zoomInstructionsVisible: false };
    this._setActiveSphere();
  }

  componentDidMount() {
    // watch for setup stones
    this.unsubscribeSetupEvents = [];
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupStonesDetected",  () => { this.forceUpdate(); }));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("noSetupStonesVisible", () => { this.forceUpdate(); }));

    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (change.removeSphere) {
        this.props.store.dispatch({type:"CLEAR_ACTIVE_SPHERE"});
        this._updateNavBar();
        this.setState({zoomLevel: ZOOM_LEVELS.sphere});
        return;
      }


      if (change.changeSpheres) {
        this._setActiveSphere(true);
      }
      else if (change.updateActiveSphere) {
        this._setActiveSphere(false);
      }


      if (
        change.changeMessageState   ||
        change.changeAppSettings    ||
        change.changeSphereState    ||
        change.changeSphereConfig   ||
        change.stoneLocationUpdated ||
        change.updateSphereUser     ||
        change.updateStoneConfig    ||
        change.updateActiveSphere   ||
        change.updateLocationConfig ||
        change.changeFingerprint    ||
        change.changeSpheres        ||
        change.changeStones         ||
        change.changeLocations
      ) {
        this.forceUpdate();
        this._updateNavBar();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeSetupEvents.forEach((unsubscribe) => {unsubscribe();});
    this.unsubscribeStoreEvents();
    NAVBAR_PARAMS_CACHE = null;
  }


  _setActiveSphere(updateStore = false) {
    // set the active sphere if needed and setup the object variables.
    let state = this.props.store.getState();
    let activeSphere = state.app.activeSphere;

    let sphereIds = Object.keys(state.spheres).sort((a,b) => {return state.spheres[b].config.name - state.spheres[a].config.name});
    // handle the case where we deleted a sphere that was active.
    if (state.spheres[activeSphere] === undefined) {
      activeSphere = null;
    }
    if (activeSphere === null && sphereIds.length > 0) {
      if (sphereIds.length === 1) {
        this.props.store.dispatch({type: "SET_ACTIVE_SPHERE", data: {activeSphere: sphereIds[0]}});
      }
      else if (updateStore) {
        let presentSphereId = Util.data.getPresentSphereId(state);
        if (!presentSphereId) {
          this.props.store.dispatch({type: "SET_ACTIVE_SPHERE", data: {activeSphere: null}});
        }
        else {
          this.props.store.dispatch({type: "SET_ACTIVE_SPHERE", data: {activeSphere: presentSphereId}});
        }
      }
    }

    this._updateNavBar();
  }


  _updateNavBar() {
    let state = this.props.store.getState();
    let params = getNavBarParams(state, this.props, this.state);
    this.props.navigation.setParams(params)
  }

  _getSphereSelectButton(state, amountOfSpheres, viewingRemotely, activeSphereId) {
    if (this.state.zoomLevel !== ZOOM_LEVELS.sphere) {
      if (amountOfSpheres > 1) {
        return <SphereChangeButton viewingRemotely={viewingRemotely} sphereId={activeSphereId} onPress={() => {
          let newState = {zoomLevel: ZOOM_LEVELS.sphere};

          if (state.app.hasZoomedOutForSphereOverview === false) {
            newState["zoomInstructionsVisible"] = true;
          }
          this.setState(newState, () => { this._updateNavBar(); })
        }}/>;
      }
    }
  }

  _getAddItemButton(viewingRemotely, activeSphereId) {
    if (this.state.zoomLevel !== ZOOM_LEVELS.sphere) {
      if (Permissions.inSphere(activeSphereId).addRoom) {
         return <AddItemButton viewingRemotely={viewingRemotely} sphereId={activeSphereId} />;
      }
    }
  }

  _getContent(state, amountOfSpheres, activeSphereId) {
    let zoomOutCallback = () => {
      if (!activeSphereId) { return; }

      if (amountOfSpheres > 1) {
        if (this.state.zoomLevel === ZOOM_LEVELS.room) {
          // tell the app the user has done this and we don't need to tell him any more.
          if (state.app.hasZoomedOutForSphereOverview === false) {
            this.props.store.dispatch({type: "UPDATE_APP_SETTINGS", data: { hasZoomedOutForSphereOverview: true }});
          }
          this.setState({zoomLevel: ZOOM_LEVELS.sphere}, () => { this._updateNavBar(); });
        }
        else { // this is for convenience, it's not accurate but it'll do
          this.setState({zoomLevel: ZOOM_LEVELS.room}, () => { this._updateNavBar(); });
        }
      }
    }

    let zoomInCallback = () => {
      if (!activeSphereId) { return; }

      if (this.state.zoomLevel === ZOOM_LEVELS.sphere) {
        this.setState({zoomLevel: ZOOM_LEVELS.room}, () => { this._updateNavBar(); });
      }
    }

    if (this.state.zoomLevel !== ZOOM_LEVELS.sphere && activeSphereId) {
      return <Sphere sphereId={activeSphereId} store={this.props.store} eventBus={this.props.eventBus} multipleSpheres={amountOfSpheres > 1} zoomOutCallback={zoomOutCallback} />
    }
    else {
      return (
        <SphereLevel
          selectSphere={(sphereId) => {
            this.props.store.dispatch({type:"SET_ACTIVE_SPHERE", data: { activeSphere:sphereId }});
            this.setState({zoomLevel:ZOOM_LEVELS.room}, () => {  this._updateNavBar(); });
          }}
          zoomInCallback={zoomInCallback}
          zoomOutCallback={zoomOutCallback}
          store={this.props.store}
          eventBus={this.props.eventBus}
        />
      );
    }
  }

  _getInstructionScreen() {
    return (
      <ZoomInstructionOverlay
        visible={this.state.zoomInstructionsVisible}
        closeCallback={() => { this.setState({zoomInstructionsVisible: false})}}
      />
    );
  }

  render() {
    LOG.info("RENDERING_OVERVIEW");
    const store = this.props.store;
    const state = store.getState();

    let amountOfSpheres = Object.keys(state.spheres).length;
    let activeSphereId = state.app.activeSphere;
    let background = this.props.backgrounds.main;

    if (amountOfSpheres > 0) {

      if (!activeSphereId) {
        return (
          <AnimatedBackground image={require("../../images/sphereBackground.png")}>
            <OrangeLine/>
            { this._getContent(state, amountOfSpheres, activeSphereId) }
          </AnimatedBackground>
        );
      }

      let activeSphere = state.spheres[activeSphereId];
      let sphereIsPresent = activeSphere.state.present;

      let noStones = (activeSphereId ? Object.keys(activeSphere.stones).length    : 0) == 0;
      let noRooms  = (activeSphereId ? Object.keys(activeSphere.locations).length : 0) == 0;

      let viewingRemotely = true;
      if (sphereIsPresent || SetupStateHandler.areSetupStonesAvailable() || DfuStateHandler.areDfuStonesAvailable() || (noStones === true && noRooms === true)) {
        viewingRemotely = false;
        background = this.props.backgrounds.main;
      }
      else {
        background = this.props.backgrounds.mainRemoteNotConnected;
      }

      if (this.state.zoomLevel === ZOOM_LEVELS.sphere) {
        background = require("../../images/sphereBackground.png");
      }

      return (
        <AnimatedBackground image={background}>
          <OrangeLine/>
          { this._getContent(state, amountOfSpheres, activeSphereId) }
          { this._getSphereSelectButton(state, amountOfSpheres, viewingRemotely, activeSphereId) }
          { this._getAddItemButton(viewingRemotely, activeSphereId) }
          { this._getInstructionScreen() }
        </AnimatedBackground>
      );
    }
    else {
      return (
        <AnimatedBackground image={background} hasTopBar={false} safeView={true}>
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Icon name="c1-sphere" size={150} color={colors.csBlue.hex}/>
            <Text style={overviewStyles.mainText}>{ lang("No_Spheres_available_") }</Text>
            <Text style={overviewStyles.subText}>{ lang("Press_Edit_in_the_upper_r") }</Text>
          </View>
        </AnimatedBackground>
      );
    }
  }
}

function getNavBarParams(state, props, viewState) {
  let { sphereId, sphere } = SphereUtil.getActiveSphere(state);
  LOG.info("UPDATING SPHERE OVERVIEW NAV BAR", viewState.zoomLevel === ZOOM_LEVELS.sphere , (sphereId === null && Object.keys(state.spheres).length > 0));

  if (viewState.zoomLevel === ZOOM_LEVELS.sphere || (sphereId === null && Object.keys(state.spheres).length > 0)) {
    NAVBAR_PARAMS_CACHE = {
      title: lang("Sphere_Overview"),
      showMailIcon: false,
      showFinalizeNavigationButton: false,
      showFinalizeIndoorNavigationCallback: false,
      rightLabel: null,
      rightAction: () => {},
    }
  }
  else {
    if (sphereId === null) {
      NAVBAR_PARAMS_CACHE = {
        title: lang("Hello_there_"),
        showFinalizeNavigationButton: false,
        rightLabel: lang("Edit"),
        rightAction: () => {
          Actions.sphereEdit()
        },
      }
    }
    else {
      let finalizeLocalization = SphereUtil.finalizeLocalizationData(state);
      let newMailAvailable = SphereUtil.newMailAvailable(state);

      NAVBAR_PARAMS_CACHE = {
        title: sphere.config.name,
        showMailIcon: newMailAvailable,
        showFinalizeNavigationButton: finalizeLocalization.showItem,
        showFinalizeIndoorNavigationCallback: finalizeLocalization.action,
        rightLabel: lang("Edit"),
        rightAction: () => { Actions.sphereEdit({sphereId: sphereId}) },
        activeSphereId: sphereId,
      }
    }
  }


  return NAVBAR_PARAMS_CACHE;

}

let NAVBAR_PARAMS_CACHE = null;

