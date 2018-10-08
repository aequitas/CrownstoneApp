import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {LOG, LOGe} from '../../logging/Log'
import { BlePromiseManager }                          from '../../logic/BlePromiseManager'
import { addDistanceToRssi, Util }                    from '../../util/Util'
import { OverlayBox }                                 from '../components/overlays/OverlayBox'
import { eventBus }                                   from '../../util/EventBus'
import { styles, colors , screenHeight, screenWidth } from '../styles'

export class TapToToggleCalibration extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);

    this.state = { visible: false, step:0, tutorial: true, canClose: false};
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on("CalibrateTapToToggle", (data : any = {}) => {
      let state = this.props.store.getState();
      if (state.app.tapToToggleEnabled !== false) {
        eventBus.emit("ignoreTriggers");
        this.setState({
          visible: true,
          step: data.tutorial === false ? 1 : 0,
          tutorial: data.tutorial === undefined ? true  : data.tutorial
        });
      }
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }


  learnDistance(attempt = 0) {
    // show loading screen
    eventBus.emit("showLoading", "Waiting to start learning...");

    // make sure we don't strangely trigger stuff while doing this.
    eventBus.emit("ignoreTriggers");

    let learnDistancePromise = () => {
      return new Promise((resolve, reject) => {
        eventBus.emit("showLoading", "Finding Tap-to-Toggle distance...");
        // timeout for the user to put his phone on the
        setTimeout(() => {
          eventBus.emit("showLoading", "Learning Tap-to-Toggle distance...");
          // waiting for the data to be collected. We use the RSSI updates through the iBeacon messages which come in at
          // StoneStateHandler.js ~ line 35
          setTimeout(() => {
            let state = this.props.store.getState();
            let sphereIds = Object.keys(state.spheres);
            let minRSSI = -1000;

            // search through all present spheres  that are not disabled and have RSSI indicators
            sphereIds.forEach((sphereId) => {
              let sphere = state.spheres[sphereId];
              if (sphere.state.present === true) {
                let stoneIds = Object.keys(sphere.stones);
                stoneIds.forEach((stoneId) => {
                  let stone = sphere.stones[stoneId];
                  if (stone.reachability.disabled === false) {
                    minRSSI = Math.max(stone.reachability.rssi, minRSSI);
                  }
                });
              }
            });
            LOG.info("TapToToggleCalibration: measured RSSI", minRSSI);
            resolve(minRSSI);
          }, 3500);
        }, 1000);
      })
    };

    BlePromiseManager.registerPriority(learnDistancePromise, {from:'Tap-to-toggle distance estimation.'})
      .then((nearestRSSI : number) => {
        if (nearestRSSI > -70) {
          let rssiAddedDistance = Math.max(nearestRSSI - 5, addDistanceToRssi(nearestRSSI, 0.1));
          LOG.info("TapToToggleCalibration: measured RSSI", nearestRSSI, 'added distance value:', rssiAddedDistance);

          let state = this.props.store.getState();
          let currentDeviceSpecs = Util.data.getDeviceSpecs(state);
          let deviceId = Util.data.getDeviceIdFromState(state, currentDeviceSpecs.address);
          this.props.store.dispatch({
            type: 'UPDATE_DEVICE_CONFIG',
            deviceId: deviceId,
            data: { tapToToggleCalibration: rssiAddedDistance }
          });
          eventBus.emit("showLoading", Languages.title("TapToToggleCalibration", "Great_")());

          setTimeout(() => {
            eventBus.emit("hideLoading");
          }, 500);
          this.setState({step:2});
        }
        else {
          eventBus.emit("hideLoading");
          if (attempt === 2) {
            Alert.alert(
Languages.alert("TapToToggleCalibration", "_Thats_a_bit_far_away___M_header")(),
Languages.alert("TapToToggleCalibration", "_Thats_a_bit_far_away___M_body")(),
[{text:Languages.alert("TapToToggleCalibration", "_Thats_a_bit_far_away___M_left")()}])
          }
          else {
            let defaultAction = () => {this.learnDistance(attempt + 1)};
            Alert.alert(
Languages.alert("TapToToggleCalibration", "_Thats_a_bit_far_away___T_header")(),
Languages.alert("TapToToggleCalibration", "_Thats_a_bit_far_away___T_body")(),
[{text:Languages.alert("TapToToggleCalibration", "_Thats_a_bit_far_away___T_left")(), onPress: defaultAction }], { onDismiss: defaultAction })
          }

        }
      })
      .catch((err) => {
        LOGe.info("TapToToggleCalibration error:", err);
        eventBus.emit("hideLoading");
        Alert.alert(
Languages.alert("TapToToggleCalibration", "_Something_went_wrong__Ma_header")(),
Languages.alert("TapToToggleCalibration", "_Something_went_wrong__Ma_body")(),
[{text:Languages.alert("TapToToggleCalibration", "_Something_went_wrong__Ma_left")()}])
      })
  }

  getContent() {
    let state = this.props.store.getState();
    let presentSphereId = Util.data.getPresentSphereId(state);

    let props : any = {};
    switch(this.state.step) {
      case 0:
        props = {
          title: Languages.title("TapToToggleCalibration", "Using_Tap_to_Toggle")(),
          image: require('../../images/lineDrawings/holdingPhoneNextToPlugDarkBlank.png'),
          header:  Languages.label("TapToToggleCalibration", "Now_that_youve_added_a_Cr")(),
          explanation: "Tap-to-toggle means you can switch the Crownstone just by holding your phone really close to it!",
          back: false,
          nextCallback: () => {this.setState({step:1});},
          nextLabel: Languages.label("TapToToggleCalibration", "Next")()};
        break;
      case 1:
        props = {
          title: Languages.title("TapToToggleCalibration", "Setting_it_up")(),
          image: require('../../images/lineDrawings/holdingPhoneNextToPlugDarkBlank.png'),
          header:  Languages.label("TapToToggleCalibration", "In_order_to_use_tap_to_to")(),
          explanation: "This will only take a minute and will only have to be done once. Hold your phone really close to a Crownstone and press 'Next'.",
          back: true,
          backCallback: () => {this.setState({step:0});},
          nextCallback: () => {this.learnDistance()},
          nextLabel: Languages.label("TapToToggleCalibration", "Next")()};
        if (this.state.tutorial === false) {
          props.title =  Languages.label("TapToToggleCalibration", "Calibration")();
          props.header =  Languages.label("TapToToggleCalibration", "To_start_calibrating_tap_")();
          props.explanation =  Languages.label("TapToToggleCalibration", "The_new_distance_will_be_")();
          props.back = false;
          props.nextLabel =  Languages.label("TapToToggleCalibration", "Start")();
        }
        break;
      case 2:
        props = {
          title:  Languages.label("TapToToggleCalibration", "Great_")(),
          image: require('../../images/lineDrawings/holdingPhoneNextToPlugDarkToggle.png'),
          header: "Now that I can recognise it with your phone, let's try tap-to-toggle!",
          explanation: "After you click 'Next' I'll enable tap-to-toggle and you can try it out! You can recalibrate your tap-to-toggle in the settings.",
          back: true,
          backCallback: () => {this.setState({step:1});},
          nextCallback: () => {eventBus.emit("useTriggers"); this.setState({step:3})},
          nextLabel: Languages.label("TapToToggleCalibration", "Next")()};

        if (this.state.tutorial === false) {
          props.title =  Languages.label("TapToToggleCalibration", "Done_")();
          props.header =  Languages.label("TapToToggleCalibration", "The_new_distance_has_been")();
          props.explanation =  Languages.label("TapToToggleCalibration", "Once_you_press_Done_the_n")();
          props.nextCallback = () => {eventBus.emit("useTriggers"); this.setState({visible: false})},
          props.nextLabel =  Languages.label("TapToToggleCalibration", "Done")()}
        break;
      case 3:
        props = {
          title: Languages.title("TapToToggleCalibration", "Lets_give_it_a_try_")(),
          image: require('../../images/lineDrawings/holdingPhoneNextToPlugDarkToggle.png'),
          header:  Languages.label("TapToToggleCalibration", "Touch_your_phone_to_the_C")(),
          explanation: "Once the phone vibrates, it will start to toggle. If you're trying this on a built-in, make sure you enable tap-to-toggle in it's settings (Room overview -> Crownstone Overview -> Edit).",
          back: true,
          backCallback: () => {this.setState({step:1});},
          nextCallback: () => {this.setState({visible: false});},
          nextLabel: Languages.label("TapToToggleCalibration", "Finish_")()};
        break;
    }

    if (!presentSphereId) {
      props = {
        title: Languages.title("TapToToggleCalibration", "Training_Tap_to_Toggle")(),
        image: require('../../images/lineDrawings/holdingPhoneNextToPlugDarkBlank.png'),
        header:  Languages.label("TapToToggleCalibration", "Tap_to_toggle_can_only_be")(),
        explanation: 'Try it again later when you\'re in your Sphere',
        back: false,
        nextCallback: () => { this.setState({visible: false});},
        nextLabel: Languages.label("TapToToggleCalibration", "OK")()};
    }

    return (
      <View style={{flex:1, alignItems:'center'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold', color: colors.csBlue.hex, padding:15}}>{props.title}</Text>
        <Image source={props.image} style={{width:0.45*screenWidth, height:0.45*screenWidth, margin:0.025*screenHeight}} />
        <Text style={{fontSize: 14, fontWeight: 'bold', color: colors.csBlue.hex, textAlign:'center'}}>{props.header}</Text>
        <View style={{flex:1}}/>
        <Text style={{fontSize: 12, color: colors.blue.hex, textAlign:'center', paddingLeft:10, paddingRight:10}}>{props.explanation}</Text>
        <View style={{flex:1}}/>
        { props.back ?
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity onPress={props.backCallback} style={[styles.centered, {
              width: 0.3 * screenWidth,
              height: 36,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: colors.blue.rgba(0.2),
            }]}>
              <Text style={{fontSize: 14, color: colors.blue.rgba(0.6)}}>{ Languages.text("TapToToggleCalibration", "Back")() }</Text>
            </TouchableOpacity>
            <View style={{flex: 1}}/>
            <TouchableOpacity onPress={props.nextCallback} style={[styles.centered, {
              width: 0.3 * screenWidth,
              height: 36,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: colors.blue.rgba(0.5),
            }]}>
              <Text style={{fontSize: 14, color: colors.blue.hex}}>{props.nextLabel}</Text>
            </TouchableOpacity>
          </View>
          :
          <TouchableOpacity onPress={props.nextCallback} style={[styles.centered, {
            width: 0.4 * screenWidth,
            height: 36,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: colors.blue.rgba(0.5),
          }]}>
            <Text style={{fontSize: 14, color: colors.blue.hex}}>{props.nextLabel}</Text>
          </TouchableOpacity>
        }
      </View>
    )
  }

  abortCloseCallback() {
    // when closed without training, tell the user where to find the calibration button.
    if (this.state.tutorial === true) {
      let explanationLabel =  Languages.label("TapToToggleCalibration", "You_can_calibrate_tap_to_")();
      if (Platform.OS === 'android') {
        explanationLabel =  Languages.label("TapToToggleCalibration", "You_can_calibrate_tap_to_t")();
      }
      Alert.alert(
Languages.alert("TapToToggleCalibration", "_Training_Tap_to_Toggle_L_header")(),
Languages.alert("TapToToggleCalibration", "_Training_Tap_to_Toggle_L_body")(explanationLabel),
[{text:Languages.alert("TapToToggleCalibration", "_Training_Tap_to_Toggle_L_left")()}])
    }
    eventBus.emit("useTriggers");
    this.setState({visible: false});
  }

  render() {
    return (
      <OverlayBox
        visible={this.state.visible} canClose={true}
        closeCallback={() => {this.abortCloseCallback();}}
        overrideBackButton={() => { if (this.state.step === 0) { this.abortCloseCallback(); }}}
        backgroundColor={colors.csBlue.rgba(0.3)}
        width={Math.min(320, 0.9*screenWidth)}
        height={Math.min(500, 0.95*screenHeight)}
      >
        {this.getContent()}
      </OverlayBox>
    );
  }
}