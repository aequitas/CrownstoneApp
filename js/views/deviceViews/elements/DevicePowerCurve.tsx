import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DevicePowerCurve", key)(a,b,c,d,e);
}
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

import { screenWidth, availableScreenHeight, deviceStyles } from "../../styles";
import {Graph} from "../../components/graph/Graph";
import {Util} from "../../../util/Util";
import {eventBus} from "../../../util/EventBus";
import {textStyle} from "./DeviceBehaviour";


export class DevicePowerCurve extends LiveComponent<any, any> {
  unsubscribeStoreEvents;
  // debugInterval;


  componentDidMount() {
    this.unsubscribeStoreEvents = eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (
        change.powerUsageUpdated && change.powerUsageUpdated.stoneIds[this.props.stoneId]
      ) {
        this.forceUpdate();
      }
    });
  }


  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];

    let dateId = Util.getDateHourId(new Date().valueOf());

    let dataStream = [];
    if (stone.powerUsage[dateId]) {
      dataStream = stone.powerUsage[dateId].data;
    }

    return (
      <View style={{flex:1, flexDirection: 'column', alignItems:'center', paddingTop:30}}>
        <Text style={deviceStyles.header}>{ lang("Power_Usage") }</Text>
        <View style={{flex:0.75}} />
        <Graph width={screenWidth} height={availableScreenHeight/2} data={dataStream} xField="timestamp" yField="power"/>
        <View style={{flex:5}}>
          <ScrollView style={{flex:1}}>
            <Text style={[textStyle.explanation, {fontWeight:'bold'}]}>{ lang("Sneak_preview_of_the_dyna") }</Text>
            <Text style={textStyle.explanation}>{ lang("Stand_near_the_Crownstone") }</Text>
          </ScrollView>
        </View>
      </View>
    )
  }
}