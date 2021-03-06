
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("NewLocalizationSettings", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {screenWidth} from "../../../styles";
import {WNStyles} from "../WhatsNewStyles";


export class NewLocalizationSettings extends Component<any, any> {
  render() {
    let size = (0.85*screenWidth - 35 - 20 - 10)/713;

    let text = '';
    if (Platform.OS === 'android') {
      text = "By turning off the background features in your settings you’ll eliminate any battery usage of the app in the background." +
        " However, by turning off these functionalities you’ll only be able to use the app as a remote control. " +
        "\n\nYou can get there from the sidebar: \n\"App Settings\"\n"
    }
    else { // ios
      text = "If you don't want to use the background features, the app will not use any battery when it is not in the foreground. " +
        "However, this also means the indoor localization won't work so you can only use the app as a remote control." +
        "\n\nYou can get there like this: \nSettings -> App Settings\n"
    }

    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("There_are_new_settings_to") }</Text>
            <Image source={require('../../../../images/whatsNew/1.10.0/newSettings.png')} style={{width:713*size, height:523*size, marginTop:40, marginBottom:40}}/>
            <Text style={WNStyles.detail}>{text }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


