import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  ScrollView,
  TouchableHighlight,
  TouchableOpacity,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import { Background }            from '../components/Background'
import { setupStyle }            from './SetupShared'
import {colors, screenWidth, screenHeight, OrangeLine} from './../styles'
import { Util }                  from '../../util/Util'
import { BleUtil }               from '../../util/BleUtil'
import { BluenetPromiseWrapper } from '../../native/libInterface/BluenetPromise'
import {LOG, LOGe} from '../../logging/Log'
import { BlePromiseManager }     from "../../logic/BlePromiseManager";
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import {BackAction} from "../../util/Back";

export class SettingsFactoryResetStep2 extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: Languages.title("SettingsFactoryResetStep2", "Resettings")()}
  };

  lookingForCrownstone : boolean = true;
  uuid : string = Util.getUUID();

  constructor(props) {
    super(props);
    this.state = {
      text:'Looking for Crownstones nearby...',
      fade2: new Animated.Value(0),
      fade1: new Animated.Value(1),
    };
  }

  componentDidMount() {
    // this will ignore things like tap to toggle and location based triggers so they do not interrupt.
    this.props.eventBus.emit("ignoreTriggers");

    // this is done with an event to avoid double starting due to additional construction by the navigation lib.
    this.props.eventBus.on("StartFactoryResetProcess", () => {
      // we scan high frequency when we see a setup node
      BleUtil.startHighFrequencyScanning(this.uuid, true);
      this.searchForStone()
    });
  }

  componentWillUnmount() {
    // Restore trigger state
    this.props.eventBus.emit("useTriggers");
    BleUtil.startHighFrequencyScanning(this.uuid);
    BleUtil.cancelAllSearches();
  }

  switchImages() {
    if (this.lookingForCrownstone === true) {
      this.setState({text:'Attempting to reset Crownstone...',});
      Animated.timing(this.state.fade1, {toValue: 0, duration: 200}).start();
      setTimeout(() => {
        Animated.timing(this.state.fade2, {toValue: 1, duration: 200}).start();
      }, 150);
      this.lookingForCrownstone = false;
    }
    else {
      this.setState({text:'Looking for Crownstones nearby...'});
      Animated.timing(this.state.fade2, {toValue: 0, duration: 200}).start();
      setTimeout(() => {
        Animated.timing(this.state.fade1, {toValue: 1, duration: 200}).start();
      }, 150);
      this.lookingForCrownstone = true;
    }
  }

  _getDescription(stoneInfo) {
    let description = stoneInfo.name;
    if (stoneInfo.applianceName)
      description +=  " with " + stoneInfo.applianceName;
    if (stoneInfo.locationName)
      description +=  " in " + stoneInfo.applianceName;
    return description;
  }

  _removeOwnedCrownstone(handle) {
    // todo: think about what to do here. What if the person is not an admin?
    this.recoverStone(handle);
  }


  searchForStone() {
    BleUtil.cancelAllSearches();

    let map = MapProvider.stoneHandleMap;

    let nearestSetup = undefined;
    let nearestNormal = undefined;
    let promises = [];

    promises.push(BleUtil.getNearestCrownstone(4000).then((result) => { nearestNormal = result; }));
    promises.push(BleUtil.getNearestSetupCrownstone(4000).then((result) => { nearestSetup = result; }));

    Promise.all(promises)
      .then(() => {
        // we detect one in setup mode and another one that is ours.
        if (map[nearestNormal.handle]) {
          let description = this._getDescription(map[nearestNormal.handle]);
          if (nearestNormal.rssi > -60) {
            Alert.alert(
Languages.alert("SettingsFactoryResetStep2", "_Crownstone_in_Setup_mode_header")(),
Languages.alert("SettingsFactoryResetStep2", "_Crownstone_in_Setup_mode_body")(description),
[{text:Languages.alert("SettingsFactoryResetStep2", "_Crownstone_in_Setup_mode_left")(), style: 'cancel', onPress: () => { BackAction(); }},{
text:Languages.alert("SettingsFactoryResetStep2", "_Crownstone_in_Setup_mode_right")(), onPress: () => {
                this._removeOwnedCrownstone(nearestNormal.handle);
              }}],
              { cancelable: false }
            );
          }
          else {
            let defaultAction = () => { BackAction(); };
            Alert.alert(
Languages.alert("SettingsFactoryResetStep2", "_Crownstone_in_Setup_mode__header")(),
Languages.alert("SettingsFactoryResetStep2", "_Crownstone_in_Setup_mode__body")(description),
[{text:Languages.alert("SettingsFactoryResetStep2", "_Crownstone_in_Setup_mode__left")(), onPress: defaultAction }],
              { cancelable: false }
            );
          }
        }
        else {
          // both setup AND normal in range.
          if (nearestNormal.rssi > -60) {
            Alert.alert(
Languages.alert("SettingsFactoryResetStep2", "_Crownstone_in_Setup_mode_n_header")(),
Languages.alert("SettingsFactoryResetStep2", "_Crownstone_in_Setup_mode_n_body")(),
[{text:Languages.alert("SettingsFactoryResetStep2", "_Crownstone_in_Setup_mode_n_left")(), style: 'cancel', onPress: () => { BackAction(); }},{
text:Languages.alert("SettingsFactoryResetStep2", "_Crownstone_in_Setup_mode__right")(), onPress: () => { this.recoverStone(nearestNormal.handle); }}],
              { cancelable: false }
            );
          }
          else {
            Alert.alert(
Languages.alert("SettingsFactoryResetStep2", "_Crownstone_in_Setup_mode_ne_header")(),
Languages.alert("SettingsFactoryResetStep2", "_Crownstone_in_Setup_mode_ne_body")(),
[{text:Languages.alert("SettingsFactoryResetStep2", "_Crownstone_in_Setup_mode_ne_left")(), style: 'cancel', onPress: () => { BackAction(); }},{
text:Languages.alert("SettingsFactoryResetStep2", "_Crownstone_in_Setup_mode_n_right")(), onPress: () => { this.recoverStone(nearestNormal.handle); }}],
              { cancelable: false }
            );
          }
        }
      })
      .catch((err) => {
        let defaultAction = () => { BackAction(); };
        // either setup or normal or none in range
        if (nearestSetup === undefined && nearestNormal !== undefined) {
          // we detect only our own crownstones.
          if (map[nearestNormal.handle]) {
            let description = this._getDescription(map[nearestNormal.handle]);
            if (nearestNormal.rssi > -60) {
              Alert.alert(
Languages.alert("SettingsFactoryResetStep2", "_No_unknown_Crownstone_ne_header")(),
Languages.alert("SettingsFactoryResetStep2", "_No_unknown_Crownstone_ne_body")(description),
[{text:Languages.alert("SettingsFactoryResetStep2", "_No_unknown_Crownstone_ne_left")(), style: 'cancel', onPress: () => { BackAction(); BackAction(); }},{
text:Languages.alert("SettingsFactoryResetStep2", "_No_unknown_Crownstone_ne_right")(), onPress: () => {
                  this._removeOwnedCrownstone(nearestNormal.handle);
                }}],
                { cancelable: false }
              );
            }
            else {
              Alert.alert(
Languages.alert("SettingsFactoryResetStep2", "_No_unknown_Crownstones_f_header")(),
Languages.alert("SettingsFactoryResetStep2", "_No_unknown_Crownstones_f_body")(description),
[{text:Languages.alert("SettingsFactoryResetStep2", "_No_unknown_Crownstones_f_left")(), onPress: defaultAction }],
                { cancelable: false }
              );
            }
          }
          else {
            if (nearestNormal.rssi > -70) {
              this.recoverStone(nearestNormal.handle);
            }
            else {
              Alert.alert(
Languages.alert("SettingsFactoryResetStep2", "_No_Crownstones_near___We_header")(),
Languages.alert("SettingsFactoryResetStep2", "_No_Crownstones_near___We_body")(),
[{text:Languages.alert("SettingsFactoryResetStep2", "_No_Crownstones_near___We_left")(), onPress: defaultAction }],
                { cancelable: false }
              );
            }
          }
        }
        else if (nearestSetup !== undefined && nearestNormal === undefined) {
          Alert.alert(
Languages.alert("SettingsFactoryResetStep2", "_Recovery_might_not_be_ne_header")(),
Languages.alert("SettingsFactoryResetStep2", "_Recovery_might_not_be_ne_body")(),
[{text:Languages.alert("SettingsFactoryResetStep2", "_Recovery_might_not_be_ne_left")(), onPress: defaultAction }],
            { cancelable: false }
          )
        }
        else {
          Alert.alert(
Languages.alert("SettingsFactoryResetStep2", "_No_nearby_Crownstones____header")(),
Languages.alert("SettingsFactoryResetStep2", "_No_nearby_Crownstones____body")(),
[{text:Languages.alert("SettingsFactoryResetStep2", "_No_nearby_Crownstones____left")(), onPress: defaultAction }],
            { cancelable: false }
          )
        }
      })
  }

  recoverStone(handle) {
    this.switchImages();
    LOG.info('attempting to factory reset handle:', handle);
    let recoveryPromise = () => {
      return BluenetPromiseWrapper.recover(handle);
    };

    BlePromiseManager.registerPriority(recoveryPromise, {from: 'Recovering stone'})
      .then(() => {
        let defaultAction = () => {
          // pop twice to get back to the settings.
          BackAction();
          BackAction();
        };
        Alert.alert(
Languages.alert("SettingsFactoryResetStep2", "_Success___This_Crownston_header")(),
Languages.alert("SettingsFactoryResetStep2", "_Success___This_Crownston_body")(),
[{text:Languages.alert("SettingsFactoryResetStep2", "_Success___This_Crownston_left")(), onPress: defaultAction}],
          { cancelable: false }
        )
      })
      .catch((err) => {
        LOGe.info("ERROR IN RECOVERY", err);
        let defaultAction = () => { BackAction(); };
        if (err === "NOT_IN_RECOVERY_MODE") {
          Alert.alert(
Languages.alert("SettingsFactoryResetStep2", "_Not_in_Factory_Reset_mod_header")(),
Languages.alert("SettingsFactoryResetStep2", "_Not_in_Factory_Reset_mod_body")(),
[{text:Languages.alert("SettingsFactoryResetStep2", "_Not_in_Factory_Reset_mod_left")(), onPress: defaultAction}],
            { cancelable: false }
          )
        }
        else {
          Alert.alert(
Languages.alert("SettingsFactoryResetStep2", "_Error_during_Factory_Res_header")(),
Languages.alert("SettingsFactoryResetStep2", "_Error_during_Factory_Res_body")(),
[{text:Languages.alert("SettingsFactoryResetStep2", "_Error_during_Factory_Res_left")(), onPress: defaultAction}],
            { cancelable: false }
          )
        }
      })
  }

  render() {
    let imageSize = 0.45;
    let leftPos = 0.5 * (screenWidth - imageSize*screenHeight);
    return (
      <Background hasNavBar={false} image={this.props.backgrounds.detailsDark} safeView={true}>
        <OrangeLine/>
        <View style={{flex:1, flexDirection:'column', paddingTop:30}}>
          <Text style={[setupStyle.text, {color:colors.white.hex}]}>{ Languages.text("SettingsFactoryResetStep2", "Hold_your_phone_next_to_t")() }</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={[setupStyle.information, {color:colors.white.hex}]}>{this.state.text}</Text>
          <View style={{flex:1}} />
          <View style={{width: screenWidth, height:imageSize*screenHeight}}>
            <Animated.View style={{opacity:this.state.fade1, position:'absolute', left:leftPos, top: 0}}>
              <Image source={require('../../images/lineDrawings/holdingPhoneNextToPlug.png')} style={{width:imageSize*screenHeight, height:imageSize*screenHeight}} />
            </Animated.View>
            <Animated.View style={{opacity:this.state.fade2, position:'absolute', left:leftPos, top: 0}}>
              <Image source={require('../../images/lineDrawings/holdingPhoneNextToPlugPairing.png')} style={{width:imageSize*screenHeight, height:imageSize*screenHeight}} />
            </Animated.View>
          </View>
          <View style={{flex:1}} />
          <View style={{marginBottom: 20}}>
            <ActivityIndicator animating={true} color={colors.white.hex} size="large"/>
          </View>
        </View>
      </Background>
    )
  }
}

