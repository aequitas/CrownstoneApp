import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { OverlayContent }  from '../components/overlays/OverlayContent'
import { OverlayBox }      from '../components/overlays/OverlayBox'
import { eventBus }        from '../../util/EventBus'
import { FirmwareHandler } from "../../native/firmware/FirmwareHandler";
import { LOG }             from "../../logging/Log";
import { Util }            from "../../util/Util";
import { ProgressCircle }  from "../components/ProgressCircle";
import { styles, colors , screenHeight, screenWidth } from '../styles'
import {Icon} from "../components/Icon";
import {NativeBus} from "../../native/libInterface/NativeBus";
import {dfu} from "../../cloud/sections/dfu";

export class DfuOverlay extends Component<any, any> {
  unsubscribe : any = [];
  processSubscriptions = [];
  processReject : any = null;
  paused : boolean = false;
  helper : any = null;
  showTimeout : any = null;
  fallbackTimeout : any = null;

  constructor() {
    super();
    this.state = {
      visible: false,
      step: 0,
      stoneId: null,
      sphereId: null,
      progress: 0,
      phaseDescription: 'determining...',
      currentPhase: 0,
      phasesRequired: null,
      detail: ''
    };
  }

  componentDidMount() {
    // data = { stoneId : string , sphereId: string };
    eventBus.on("updateCrownstoneFirmware", (data : any = {}) => {
      this.setState({
        visible: true,
        step: 0,
        stoneId: data.stoneId,
        sphereId: data.sphereId,
        progress: 0,
        phaseDescription: '',
        currentPhase: 0,
        phasesRequired: 0,
        detail: '',
      });
    })
  }

  componentWillUnmount() {
    this.sessionCleanup();

    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  startProcess() {
    this.setState({step:1});
    let state = this.props.store.getState();
    let userConfig = state.user;
    FirmwareHandler.getNewVersions(userConfig.firmwareVersionAvailable, userConfig.bootloaderVersionAvailable)
      .then(() => {
        return new Promise((resolve, reject) => {
          this.setState({step:2});
          setTimeout(() => { resolve(); }, 2500);
        })
      })
      .then(() => {
        return this._searchForCrownstone(2000);
      })
      .then(() => {
        this.setState({ step: 5, phaseDescription:'setting up...', detail:'putting Crownstone in update mode...' });
        this.helper = FirmwareHandler.getFirmwareHelper(this.props.store, this.state.sphereId, this.state.stoneId);
        return this.helper.putInDFU();
      })
      .then(() => {
        this.setState({phaseDescription:'determining...',});
        return this.helper.getBootloaderVersion();
      })
      .then(() => {
        let phasesRequired = this.helper.getAmountOfPhases();
        if (phasesRequired > 0) {
          return this.handlePhase(0, phasesRequired, true, (progress) => { this.setState({progress:progress}); });
        }
      })
      .then(() => {
        this.setState({ step: 7 });
      })
      .catch((err) => {
        this.processReject = null;
        this.sessionCleanup();
        this.setState({ step: -1 });
        LOG.error("DfuOverlay: ERROR DURING DFU: ", err);
      })
  }

  _searchForCrownstone(minimumTimeVisibleWhenShown = 2000) : Promise<any> {
    let timeStart = new Date().valueOf();
    let searchTimeBeforeView = 1000;
    let state = this.props.store.getState();
    let stoneConfig = state.spheres[this.state.sphereId].stones[this.state.stoneId].config;

    return new Promise((resolve, reject) => {
      this.processReject = reject;

      // this allows us to initially hide this view and to only show it when the user requires it.
      // this.showTimeout = setTimeout(() => {
      //   if (this.state.step !== 3) {
      //     LOG.info("SET STEP TO 3");
      //     this.setState({ step: 3 });
      //   }
      // }, searchTimeBeforeView);

      // the timeout will show the "get closer" even if nothing is found up to that point.
      // this.fallbackTimeout = setTimeout(() => {
      //   if (this.state.step !== 4) {
      //     this.setState({ step: 4 });
      //   }
      // }, 2000);
      // this will show the user that he has to move closer to the crownstone or resolve if the user is close enough.
      let rssiResolver = (data, setupMode, dfuMode) => {
        data.setupMode = setupMode || false;
        data.dfuMode = dfuMode || false;

        console.log("DATA",data);

        if (data.rssi < -70) {
          this.setState({ step: 4 });
        }
        else if (this.paused === false) {
          let timeSeenView = new Date().valueOf() - timeStart;
          this.processReject = null;
          this.sessionCleanup();
          if (timeSeenView < minimumTimeVisibleWhenShown && (this.state.step === 3 || this.state.step === 4)) {
            setTimeout(() => { resolve(data) }, minimumTimeVisibleWhenShown - timeSeenView)
          }
          else {
            resolve(data);
          }
        }
      };
      this.processSubscriptions.push(eventBus.on(Util.events.getCrownstoneTopic(this.state.sphereId, this.state.stoneId), (data) => {
        console.log("IN EVENT", data);
        rssiResolver(data, false, false);
      }));
      this.processSubscriptions.push(NativeBus.on(NativeBus.topics.setupAdvertisement, (setupAdvertisement) => {
        console.log("IN SETUP PART", setupAdvertisement);
        if (setupAdvertisement.handle === stoneConfig.handle) {
          rssiResolver(setupAdvertisement, true, false);
        }
      }));
      this.processSubscriptions.push(NativeBus.on(NativeBus.topics.dfuAdvertisement, (dfuAdvertisement) => {
        console.log("IN DFU PART", dfuAdvertisement);
        if (dfuAdvertisement.handle === stoneConfig.handle) {
          rssiResolver(dfuAdvertisement, false, true);
        }
      }))
    })
  }

  handlePhase(phase, phasesRequired, skipSearch, progressCallback) {
    return new Promise((resolve, reject) => {
      this._searchForCrownstone(0)
        .then((data) => {
          this.setState({ step:6,  currentPhase: phase, phaseDescription: (phase + 1) + ' / '+ phasesRequired, phasesRequired: phasesRequired, progress: 0});
          this.helper.performPhase(phase, progressCallback, data.setupMode)
            .then(() => {
              let nextPhase = phase + 1;
              if (nextPhase <= phasesRequired) {
                return this.handlePhase(nextPhase, phasesRequired, false, progressCallback);
              }
              else {
                resolve()
              }
            })
            .catch((err) => { reject(err) })
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  sessionCleanup() {
    clearTimeout(this.showTimeout);
    clearTimeout(this.fallbackTimeout);

    if (typeof this.processReject === 'function') {
      this.processReject("User cancelled");
      this.processReject = null;
    }
    this.processSubscriptions.forEach((callback) => {callback()});
    this.processSubscriptions = [];

    this.paused = false;
  }


  getContent() {
    let abort = () => {
      this.paused = true;
      Alert.alert(
        "Are you sure?",
        "You can always update this Crownstone later by tapping on it again.",
        [{text:'Not yet', onPress: () => { this.paused = false; }}, {text:'OK', onPress: () => {
          this.sessionCleanup();
          this.setState({visible: false});
        }}]);
    };
    let radius = 0.28*screenWidth;
    switch (this.state.step) {
      case 0:
        return <OverlayContent
          title={'Update Available'}
          icon={'c1-update-arrow'}
          iconSize={0.35*screenWidth}
          header={'There is an update available for your Crownstone!'}
          text={'This process may take a few minutes. Please stay close to the Crownstone until it is finished. Tap next to get started!'}
          buttonCallback={() => { this.startProcess();} }
          buttonLabel={'Next'}
        />;
      case 1:
        return (
          <OverlayContent
            title={'Downloading Updates'}
            icon={'md-cloud-download'}
            header={'Downloading updates from cloud...'}
          >
            <ActivityIndicator animating={true} size="large" />
            <View style={{flex:1}} />
          </OverlayContent>
        );
      case 2:
        return (
          <OverlayContent
            title={'Download Complete'}
            icon={'md-cloud-done'}
            header={'Downloading complete!'}
            text={'Moving on!'}
          />
        );
      case 3:
        return (
          <OverlayContent
            title={'Searching'}
            icon={'c2-crownstone'}
            header={'Looking for Crownstone..'}
            buttonCallback={abort}
            buttonLabel={'Abort'}
          >
            <ActivityIndicator animating={true} size="large" />
            <View style={{flex:1}} />
          </OverlayContent>
        );
      case 4:
        return (
          <OverlayContent
            title={'Searching'}
            icon={'c2-crownstone'}
            header={'Please move a little closer to it!'}
            buttonCallback={abort}
            buttonLabel={'Abort'}
          >
            <ActivityIndicator animating={true} size="large" />
            <View style={{flex:1}} />
          </OverlayContent>
        );
      case 5:
        return (
          <OverlayContent
            title={'Preparing Crownstone'}
            eyeCatcher={
              <View style={{flex:4, backgroundColor:"transparent", alignItems:'center', justifyContent:'center'}}>
                <View style={{position:'relative', width: 2*radius, height:2*radius, alignItems:'center', justifyContent:'center'}}>
                  <ProgressCircle
                    radius={radius}
                    borderWidth={0.25*radius}
                    progress={1}
                    color={this._getLoadingColor(true)}
                    absolute={true}
                  />
                  <ActivityIndicator animating={true} size="large" style={{position:'relative', top:2,left:2}} />
                </View>
              </View>}
            header={'Putting the Crownstone in update mode now...'}
          />
        );
      case 6:
        return (
          <OverlayContent
            title={'Updating Crownstone'}
            eyeCatcher={
              <View style={{flex:4, backgroundColor:"transparent", alignItems:'center', justifyContent:'center'}}>
                <View style={{position:'relative', width: 2*radius, height:2*radius, alignItems:'center', justifyContent:'center'}}>
                  <ProgressCircle
                    radius={radius}
                    borderWidth={0.25*radius}
                    progress={1}
                    color={this._getLoadingColor(true)}
                    absolute={true}
                  />
                  <ProgressCircle
                    radius={radius}
                    borderWidth={0.25*radius}
                    progress={this.state.progress}
                    color={this._getLoadingColor(false)}
                    absolute={true}
                  />
                  <Text style={{fontSize:25, paddingBottom:10}}>{Math.floor(100*this.state.progress) + ' %'}</Text>
                  <Text style={{fontSize:13}}>{this.state.phaseDescription}</Text>
                </View>
              </View>}
            header={'Update is in progress. Please stay close to the Crownstone.'}
          />
        );
      case 7:
        return (
          <OverlayContent
            title={'Updating Done!'}
            eyeCatcher={
              <View style={{flex:4, backgroundColor:"transparent", alignItems:'center', justifyContent:'center'}}>
                <View style={{position:'relative', width: 2*radius, height:2*radius, alignItems:'center', justifyContent:'center'}}>
                  <ProgressCircle
                    radius={radius}
                    borderWidth={0.25*radius}
                    progress={1}
                    color={this._getLoadingColor(false)}
                    absolute={true}
                  />
                  <Icon name="md-checkmark" size={1.0*radius} color={this._getLoadingColor(false)} style={{position:'relative', left:0, top:0.05*radius}} />
                </View>
              </View>}
            header={'Everything is finished, enjoy the new version!'}
            buttonCallback={ () => { this.setState({visible: false}); }}
            buttonLabel={"Thanks!"}
          />
        );
      case -1:
        return (
          <OverlayContent
            title={'Update failed...'}
            eyeCatcher={
              <View style={{flex:4, backgroundColor:"transparent", alignItems:'center', justifyContent:'center'}}>
                <View style={{position:'relative', width: 2*radius, height:2*radius, alignItems:'center', justifyContent:'center'}}>
                  <ProgressCircle
                    radius={radius}
                    borderWidth={0.25*radius}
                    progress={1}
                    color={colors.csBlue.hex}
                    absolute={true}
                  />
                  <Icon name="ios-sad" size={radius} color={colors.csBlue.hex} style={{position:'relative', left:0, top:0.05*radius}} />
                </View>
              </View>}
            header={'We\'re sorry... Maybe try it again?'}
            buttonCallback={ () => { this.setState({visible: false}); }}
            buttonLabel={"Fine..."}
          />
        )
    }
  }

  _getLoadingColor(background : boolean) {
    if (background) {
      switch (this.state.currentPhase) {
        case 0:
          return colors.gray.rgba(0.3);
        case 1:
          return colors.green.hex;
        case 2:
          return colors.lightBlue2.hex;
      }
    }
    else {
      switch (this.state.currentPhase) {
        case 0:
          return colors.green.hex;
        case 1:
          return colors.lightBlue2.hex;
        case 2:
          return colors.csBlue.hex;
      }
    }

  }

  render() {
    return (
      <OverlayBox visible={this.state.visible} canClose={true} closeCallback={() => {
          let finish = () => {
            this.sessionCleanup();
            this.setState({visible: false});
          };
          if (this.state.step > 0) {
            Alert.alert("Are you sure?", "You can always update this Crownstone later.", [{text:'No'}, {text:'Yes', onPress: finish}]);
          }
          else {
            finish();
          }
        }
      } backgroundColor={colors.csBlue.rgba(0.3)}>
        {this.getContent()}
      </OverlayBox>
    );
  }
}

