import { Languages } from "../../../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
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
import {Util} from "../../../../util/Util";
import {colors, screenWidth} from "../../../styles";
import {enoughCrownstonesInLocationsForIndoorLocalization} from "../../../../util/DataUtil";
import {INTENTS} from "../../../../native/libInterface/Constants";
import {IconButton} from "../../../components/IconButton";
import {BorderCircle} from "../../../components/BorderCircle";
import {Icon} from "../../../components/Icon";


export class ActivityLogItem extends Component<any, any> {

  _getBackgroundColor() {
    if (this.props.data.cancelled) {
      return colors.menuRed.hex;
    }
    else if (this.props.data.type === "rangeStart" || this.props.data.type === "rangeEnd") {
      return colors.darkPurple.hex;
    }
    else if (this.props.data.type === "generatedEnter") {
      return colors.green.hex;
    }
    else if (this.props.data.type === "generatedExit") {
      return colors.darkPurple.hex;
    }
    else if (this.props.data.type === 'keepAlive' || this.props.data.type === 'keepAliveState' || this.props.data.type === 'skippedHeartbeat') {
      return colors.darkBackground.hex;
    }
    else if (this.props.data.type === 'tap2toggle') {
      return colors.csOrange.hex;
    }
    else if (this.props.data.type === 'multiswitch' || this.props.data.type === 'schedule') {
      let backgroundColor = colors.green.hex;
      if (this.props.data.switchedToState === 0) {
        backgroundColor = colors.csBlue.hex;
      }
      return backgroundColor;
    }
  }

  _getIcon(canDoIndoorLocalization) {
    if (this.props.data.type === 'keepAlive' || this.props.data.type === 'keepAliveState') {
      return 'ios-heart';
    }
    else if (this.props.data.type === 'tap2toggle') {
      return 'md-switch';
    }
    else if (this.props.data.type === 'schedule') {
      return 'md-calendar';
    }
    else if (this.props.data.type === 'multiswitch') {
      switch (this.props.data.intent) {
        case INTENTS.manual:
          return 'md-power'
        case INTENTS.sphereEnter:
          return 'ios-globe'
        case INTENTS.sphereExit:
          return 'ios-globe'
        case INTENTS.enter:
          // check if we have room or near
          if (canDoIndoorLocalization) {
            return 'md-cube';
          }
          else {
            return 'md-eye';
          }
        case INTENTS.exit:
          // check if we have room or near
          if (canDoIndoorLocalization) {
            return 'md-cube';
          }
          else {
            return 'md-eye-off';
          }
      }
    }
    else if (this.props.data.type === 'generatedEnter') {
      if (this.props.data.generatedFrom === 'keepAliveSphere') {
        return 'ios-globe'
      }
      else if (this.props.data.generatedFrom === 'keepAliveOther' && canDoIndoorLocalization) {
        return 'md-cube';
      }
      else if (this.props.data.generatedFrom === 'keepAliveOther') {
        return 'md-eye-off';
      }
    }

    return 'md-moon';
  }

  _getTitle(canDoIndoorLocalization, roomConfig) {
    let targetState = (this.props.data.switchedToState === 0 ? Languages.label("ActivityLogItem", "off")() :  Languages.label("ActivityLogItem", "on")());

    let timeIndicator = Util.getTimeFormat(this.props.data.timestamp) + ' - ';
    if (this.props.data.type === 'keepAlive' || this.props.data.type === 'keepAliveState') {
      return timeIndicator + Languages.label("DeviceBehaviour","Heartbeat_")();
    }
    else if (this.props.data.type === 'tap2toggle') {
      return timeIndicator + Languages.label("DeviceBehaviour","Tap_to_Toggle__")()+ targetState;
    }
    else if (this.props.data.type === 'skippedHeartbeat') {
      return this.props.data.count + Languages.label("DeviceBehaviour","_heartbeats_")();
    }
    else if (this.props.data.type === 'schedule') {
      return timeIndicator + Languages.label("DeviceBehaviour","_Schedule")();
    }
    else if (this.props.data.type === 'generatedExit') {
      if (this.props.data.isSelf) {
        if (this.props.data.generatedFrom === 'keepAliveSphere') {
          // exit sphere
          return timeIndicator + Languages.label("DeviceBehaviour","Youre_out_of_range_")();
        }
        else if (this.props.data.generatedFrom === 'keepAliveOther' && canDoIndoorLocalization) {
          // exit room
          return timeIndicator + Languages.label("DeviceBehaviour","You_left_the_")(roomConfig.name);
        }
        else if (this.props.data.generatedFrom === 'keepAliveOther') {
          // away
          return timeIndicator + Languages.label("DeviceBehaviour","You_went_away_")();
        }

      }
      else {
        if (this.props.data.generatedFrom === 'keepAliveSphere') {
          // exit sphere
          return timeIndicator + Languages.label("DeviceBehaviour","Someone_left_the_Sphere_")();
        }
        else if (this.props.data.generatedFrom === 'keepAliveOther' && canDoIndoorLocalization) {
          // exit room
          return timeIndicator + Languages.label("DeviceBehaviour","Someone_left_the_")(roomConfig.name);
        }
        else if (this.props.data.generatedFrom === 'keepAliveOther') {
          // away
          return timeIndicator + Languages.label("DeviceBehaviour","Someone_is_away_")();
        }
      }
      return timeIndicator + ' ' + this.props.data.generatedFrom + this.props.data.switchedToState;
    }
    else if (this.props.data.type === 'generatedEnter') {
      if (this.props.data.isSelf) {
        if (this.props.data.generatedFrom === 'keepAliveSphere') {
          // enter sphere
          return timeIndicator + Languages.label("DeviceBehaviour","You_entered_the_Sphere_")();
        }
        else if (this.props.data.generatedFrom === 'keepAliveOther' && canDoIndoorLocalization) {
          // enter room
          return timeIndicator + Languages.label("DeviceBehaviour","You_entered_the_")(roomConfig.name);
        }
        else if (this.props.data.generatedFrom === 'keepAliveOther') {
          // near
          return timeIndicator + Languages.label("DeviceBehaviour","You_are_near_")();
        }
      }
      else {
        if (this.props.data.generatedFrom === 'keepAliveSphere') {
          // enter sphere
          return timeIndicator + Languages.label("DeviceBehaviour","Someone_entered_the_Spher")();
        }
        else if (this.props.data.generatedFrom === 'keepAliveOther' && canDoIndoorLocalization) {
          // enter room
          return timeIndicator + Languages.label("DeviceBehaviour","Someone_entered_the_")(roomConfig.name);
        }
        else if (this.props.data.generatedFrom === 'keepAliveOther') {
          // near
          return timeIndicator + Languages.label("DeviceBehaviour","Someone_is_near_")();
        }
      }


      return timeIndicator + ' ' + this.props.data.generatedFrom + this.props.data.switchedToState;
    }
    else if (this.props.data.type === 'multiswitch') {
      switch (this.props.data.intent) {
        case INTENTS.manual:
          return timeIndicator + Languages.label("DeviceBehaviour","Switch_")()
        case INTENTS.sphereEnter:
          return timeIndicator + Languages.label("DeviceBehaviour","Entered_the_Sphere_")()
        case INTENTS.sphereExit:
          return timeIndicator + Languages.label("DeviceBehaviour","Left_the_Sphere_")()
        case INTENTS.enter:
          // check if we have room or near
          if (canDoIndoorLocalization) {
            return timeIndicator + Languages.label("DeviceBehaviour","Entered_room_")();
          }
          else {
            return timeIndicator + Languages.label("DeviceBehaviour","Moved_near_")();
          }
        case INTENTS.exit:
          // check if we have room or near
          if (canDoIndoorLocalization) {
            return timeIndicator + Languages.label("DeviceBehaviour","Left_the_room_")();
          }
          else {
            return timeIndicator + Languages.label("DeviceBehaviour","Moved_away_")();
          }
      }
    }

    return timeIndicator + this.props.data.type
  }



  _getText(canDoIndoorLocalization, roomConfig) {
    let currentState = (this.props.stone.state.state === 0 ?    Languages.label("ActivityLogItem", "off")() :  Languages.label("ActivityLogItem", "on")());
    let targetState =  (this.props.data.switchedToState === 0 ? Languages.label("ActivityLogItem", "off")() :  Languages.label("ActivityLogItem", "on")());
    let personPrefix =  Languages.label("ActivityLogItem", "You")();
    if (this.props.data.userId !== this.props.state.user.userId && this.props.data.userId) {
      personPrefix =  Languages.label("ActivityLogItem", "Someone_else")()}
    let initialLabel =  Languages.label("ActivityLogItem", "Switched_")();
    if (this.props.data.switchedToState > 0 && this.props.data.switchedToState < 0.99) {
      targetState = Math.round((this.props.data.switchedToState/0.99)*100) + " %"
      initialLabel =  Languages.label("ActivityLogItem", "Dimmed_to_")();
    }
    if (this.props.data.presumedDuplicate) {
      initialLabel =  Languages.label("ActivityLogItem", "Already_")()}

    if (this.props.data.type === 'keepAlive' || this.props.data.type === 'keepAliveState') {
      if (this.props.data.viaMesh) {
        if (this.props.data.switchedToState === -1) {
          return Languages.label("DeviceBehaviour","_told_another_Crownstone_")(personPrefix)
        }
        return  Languages.label("DeviceBehaviour","_told_another_Crownstone_switch")(personPrefix, targetState, Math.floor(this.props.data.delayInCommand / 60));
      }
      else {
        if (this.props.data.switchedToState === -1) {
          return Languages.label("DeviceBehaviour","It_will_not_change_if_no_")()
        }
        return Languages.label("DeviceBehaviour","It_will_change_if_no_")(targetState, Math.floor(this.props.data.delayInCommand / 60));
      }
    }
    else if (this.props.data.type === 'tap2toggle') {
      return Languages.label("DeviceBehaviour","_held_the_phone_so_close_")(personPrefix, personPrefix.toLowerCase());
    }
    else if (this.props.data.type === 'skippedHeartbeat') {
      return Languages.label("DeviceBehaviour","_heartbeats_once_every_")(this.props.data.count, this.props.data.averageTime);
    }
    else if (this.props.data.type === 'schedule') {
      let scheduledEndLabel =  Languages.label("ActivityLogItem", "_for_a_scheduled_action_")();
      if (this.props.data.label && this.props.data.label.length > 0) {
        scheduledEndLabel =  Languages.label("ActivityLogItem", "_for_schedule______")(this.props.data.label);
      }
      if (this.props.data.switchedToState > 0 && this.props.data.switchedToState < 0.99) {
        return initialLabel + targetState + scheduledEndLabel;
      }
      else {
        return initialLabel + targetState + scheduledEndLabel;
      }
    }
    else if (this.props.data.type === 'generatedExit') {
      if (this.props.data.generatedFrom === 'keepAliveSphere') {
        if (this.props.data.otherUserPresent) {
          return Languages.label("DeviceBehaviour","Im_still__because_there_a")(currentState);
        }
        else {
          // exit sphere
          if (this.props.data.switchedToState === -1) {
            return Languages.label("DeviceBehaviour","Last_heartbeat_sent_at_")(Util.getTimeFormat(this.props.data.endTime));
          }
          else if (this.props.data.switchedToState > 0 && this.props.data.switchedToState < 0.99) {
            return initialLabel + Math.round((this.props.data.switchedToState/0.99)*100) + " % because everyone left the Sphere.";
          }
          else {
            return initialLabel + targetState + " because everyone left the Sphere.";
          }
        }
      }
      else if (this.props.data.generatedFrom === 'keepAliveOther' && canDoIndoorLocalization) {
        if (this.props.data.switchedToState === -1) {
          return 'Sphere heartbeat expired.';
        }
        else if (this.props.data.switchedToState > 0 && this.props.data.switchedToState < 0.99) {
          return initialLabel + Math.round((this.props.data.switchedToState/0.99)*100) + " % because everyone left the " + roomConfig.name + '.';
        }
        else {
          return initialLabel + targetState + " because everyone left the " + roomConfig.name + '.';
        }
      }
      else if (this.props.data.generatedFrom === 'keepAliveOther') {
        if (this.props.data.switchedToState === -1) {
          return 'Sphere heartbeat expired.';
        }
        else if (this.props.data.switchedToState > 0 && this.props.data.switchedToState < 0.99) {
          return initialLabel + Math.round((this.props.data.switchedToState/0.99)*100) + " % because everyone is away from this Crownstone.";
        }
        else {
          return initialLabel + targetState + " because everyone is away from this Crownstone.";
        }
      }
    }
    else if (this.props.data.type === 'multiswitch') {
      let label = '';
      if ( this.props.data.delayInCommand > 0) {
        if (this.props.data.viaMesh) {
          label = personPrefix + ' told another Crownstone to switch this one ' + targetState + " after "
        }
        else {
          label = personPrefix + ' told this the Crownstone to switch ' + targetState + " after "
        }

        if (this.props.data.delayInCommand > 60) {
          label += Math.round(this.props.data.delayInCommand/60) + " minutes"
        }
        else {
          label += this.props.data.delayInCommand + " seconds"
        }

      }
      else {
        if (this.props.data.viaMesh) {
          label = personPrefix + ' told another Crownstone to switch this one ' + targetState
        }
        else {
          label = personPrefix + ' switched the Crownstone ' + targetState
        }
      }
      switch (this.props.data.intent) {
        case INTENTS.manual:
          if (this.props.data.switchedToState > 0 && this.props.data.switchedToState < 0.99) {
            return "Dimmed to " + Math.round((this.props.data.switchedToState/0.99)*100) + " %.";
          }
          else {
            return label + ".";
          }
        case INTENTS.sphereEnter:
        case INTENTS.sphereExit:
          return label + '.';
        case INTENTS.enter:
          if (this.props.data.cancelled) {
            return "Thereby cancelling the previous command."
          }
          else {
            return "The Crownstone switched " + targetState + ".";
          }
        case INTENTS.exit:
          if (this.props.data.cancelled) {
            return label +=  Languages.label("ActivityLogItem", "__but_it_was_cancelled_by")()}
          else {
            return label + '.';
          }
      }
    }
  }

  _getMeshCount() {
    if (!this.props.showFullLogs) { return }
    if (this.props.data.amountOfMeshCommands !== undefined && this.props.data.amountOfMeshCommands > 0) {
      return (
        <BorderCircle size={18} color={colors.purple.hex} style={{position: 'absolute', top: this.props.height * 0.5 - 34, left: 57}}>
          <Text style={{color: '#fff', fontSize: 10}}>{this.props.data.amountOfMeshCommands}</Text>
        </BorderCircle>
      )
    }
  }
  _getMeshIcon() {
    if (!this.props.showFullLogs) { return }
    if (this.props.data.amountOfMeshCommands !== undefined && this.props.data.amountOfMeshCommands > 0) {
      return (
        <BorderCircle size={18} color={colors.darkPurple.hex} style={{position: 'absolute', top: this.props.height * 0.5 - 25, left: 68}}>
          <Icon name={'md-share'} size={10} color={colors.white.hex}/>
        </BorderCircle>
      )
    }
  }

  _getDirectConnectIcon() {
    if (!this.props.showFullLogs) { return }
    if (this.props.data.viaMesh === false) {
      return (
        <BorderCircle size={18} borderWidth={2} color={colors.menuRed.hex} style={{position: 'absolute', top: this.props.height * 0.5 + 11, left: 65}}>
          <Icon name={'ios-bluetooth'} size={11} color={colors.white.hex}/>
        </BorderCircle>
      );
    }
  }

  render() {
    let canDoIndoorLocalization = enoughCrownstonesInLocationsForIndoorLocalization(this.props.state, this.props.sphereId) && this.props.stone.config.locationId !== null;
    let state = this.props.state;
    let sphere = state.spheres[this.props.sphereId];
    let roomConfig = {};
    if ( this.props.stone.config.locationId !== null ) {
      roomConfig = sphere.locations[this.props.stone.config.locationId].config;
    }

    return (
      <View style={{flexDirection: 'row', width: screenWidth, height: this.props.height, paddingLeft:25, alignItems:"center"}}>
        <View style={{ width: screenWidth - 60, height:2, backgroundColor: colors.white.rgba(0.3), position:'absolute', top: this.props.height*0.5, left:30}} />
        <View style={{ width: 4, height:4, borderRadius:2, backgroundColor: colors.white.rgba(0.3), position:'absolute', top: this.props.height*0.5 - 1, left: screenWidth - 30}} />

        <View style={{backgroundColor:"#fff", alignItems:'center', justifyContent:"center", width: 56, height:56, borderRadius: 28}}>
          <IconButton name={this._getIcon(canDoIndoorLocalization)} size={30} buttonSize={50} radius={25} color={'#fff'} buttonStyle={{backgroundColor: this._getBackgroundColor()}}/>
        </View>

        { this._getMeshIcon()  }
        { this._getMeshCount() }
        { this._getDirectConnectIcon() }


        <View style={{flex:1, height: this.props.height, paddingLeft: 10, paddingTop: 29, alignItems:'flex-start'}}>
          <Text style={{color:colors.white.hex, fontWeight:'bold', marginBottom:10}}>{this._getTitle(canDoIndoorLocalization, roomConfig)}</Text>
          <Text style={{color:colors.white.hex, width: screenWidth - 115}}>{this._getText(canDoIndoorLocalization, roomConfig)}</Text>
        </View>
      </View>
    )
  }

}