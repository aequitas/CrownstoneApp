import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ToonOverview", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View
} from 'react-native';
import {BackAction} from "../../../util/Back";
import {Background} from "../../components/Background";
import {ListEditableItems} from "../../components/ListEditableItems";
import { colors, deviceStyles, OrangeLine, screenHeight, screenWidth, tabBarHeight } from "../../styles";
import {IconButton} from "../../components/IconButton";
import {CLOUD} from "../../../cloud/cloudAPI";
import {Actions} from "react-native-router-flux";
import {ScaledImage} from "../../components/ScaledImage";


export class ToonOverview extends LiveComponent<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: lang("Toon"),
      headerTruncatedBackTitle: lang("Back"),
    }
  };

  unsubscribe;
  deleting;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.updatedToon && this.deleting !== true) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getItems(sphere) {
    let items = [];

    let toonIds = Object.keys(sphere.thirdParty.toons);
    toonIds.forEach((toonId) => {
      items.push({
        label: sphere.thirdParty.toons[toonId].toonAddress,
        type: 'navigation',
        callback: () => {
          Actions.toonSettings({ sphereId: this.props.sphereId, toonId: toonId })
        }
      });
    })


    items.push({type:'spacer'})

    items.push({
      label: lang("Disconnect_from_Toon"),
      type: 'button',
      icon: <IconButton name={'md-log-out'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor:colors.menuRed.hex}}/>,
      callback: () => {
        Alert.alert(
lang("_Are_you_sure__You_will_h_header"),
lang("_Are_you_sure__You_will_h_body"),
[{text:lang("_Are_you_sure__You_will_h_left"), style:'cancel'},{
text:lang("_Are_you_sure__You_will_h_right"), onPress:() => {
            this.props.eventBus.emit("showLoading","Removing the integration with Toon...")
            this.deleting = true;
            CLOUD.forSphere(this.props.sphereId).thirdParty.toon.deleteToonsInCrownstoneCloud()
              .then(() => {
                this.props.store.dispatch({
                  type: 'REMOVE_ALL_TOONS',
                  sphereId: this.props.sphereId,
                });
                BackAction()
                this.props.eventBus.emit("hideLoading")
              })
              .catch((err) => {
                this.props.eventBus.emit("hideLoading")
              })
          }}])
      }
    });
    items.push({
      type:'explanation',
      below: true,
      label: lang("This_will_remove_the_Toon")})
    items.push({type:'spacer'})

    return items;
  }


  render() {
    let state = this.props.store.getState();
    let sphere = state.spheres[this.props.sphereId];

    return (
      <Background image={this.props.backgrounds.menu} hasNavBar={false} safeView={true}>
        <OrangeLine/>
        <View style={{flex:1, alignItems:'center'}}>
          <View style={{flex:1}} />
          <ScaledImage source={require('../../../images/thirdParty/logo/Works-with-Toon.png')} targetWidth={0.6*screenWidth} sourceWidth={535} sourceHeight={140} />
          <View style={{flex:1}} />
          <Text style={[deviceStyles.errorText,{color:colors.menuBackground.hex, paddingLeft: 15, paddingRight:15}]}>{ lang("There_are_multiple_Toons_") }</Text>
          <View style={{flex:1}} />
          <ListEditableItems items={this._getItems(sphere)} separatorIndent={true} />
          <View style={{flex:1}} />
        </View>
      </Background>
    );
  }
}
