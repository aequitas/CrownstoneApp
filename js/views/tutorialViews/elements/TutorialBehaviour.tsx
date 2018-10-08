import { Languages } from "../../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import {colors, screenWidth, screenHeight, topBarHeight} from '../../styles'
import {Icon} from "../../components/Icon";
import {tutorialStyle} from "../Tutorial";


export class TutorialBehaviour extends Component<any, any> {
  render() {
    return (
      <ScrollView style={{height: screenHeight - topBarHeight, width: screenWidth}}>
        <View style={{flex:1, alignItems:'center', padding: 30}}>
          <Text style={tutorialStyle.header}>{ Languages.text("TutorialBehaviour", "Behaviour")() }</Text>
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Icon
            name="c1-brain"
            size={0.18*screenHeight}
            color={colors.white.hex}
          />
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Text style={tutorialStyle.text}>{ Languages.text("TutorialBehaviour", "Behaviour_of_Crownstones_")() }</Text>
          <View style={{width: screenWidth, height: 0.12*screenHeight}} />
        </View>
      </ScrollView>
    )
  }
}