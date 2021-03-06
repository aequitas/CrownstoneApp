
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceScheduleEdit", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  DatePickerIOS,
  Platform,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TimePickerAndroid,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import {colors, screenWidth, OrangeLine} from '../styles'
import {IconButton} from "../components/IconButton";
import {Background} from "../components/Background";
import {ListEditableItems} from "../components/ListEditableItems";
import {Util} from "../../util/Util";
import {BatchCommandHandler} from "../../logic/BatchCommandHandler";
import {Scheduler} from "../../logic/Scheduler";
import {LOG, LOGe} from "../../logging/Log";
import {StoneUtil} from "../../util/StoneUtil";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {ScheduleUtil} from "../../util/ScheduleUtil";

import UncontrolledDatePickerIOS from 'react-native-uncontrolled-date-picker-ios';
import {BackAction} from "../../util/Back";
import {CancelButton} from "../components/topbar/CancelButton";
import {TopbarButton} from "../components/topbar/TopbarButton";
import { xUtil } from "../../util/StandAloneUtil";

export let DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; // these are keys
export let DAYS_FULL = [
  lang('DAY_Monday'),
  lang('DAY_Tuesday'),
  lang('DAY_Wednesday'),
  lang('DAY_Thursday'),
  lang('DAY_Friday'),
  lang('DAY_Saturday'),
  lang('DAY_Sunday'),
];

export class DeviceScheduleEdit extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    let title =  lang("Add_Schedule");
    let rightLabel =  lang("Create");
    if (params.scheduleId) {
      title =  lang("Edit_Schedule");
      rightLabel =  lang("Save")}

    return {
      title: title,
      headerLeft: <CancelButton onPress={BackAction} />,
      headerRight: <TopbarButton
        text={rightLabel}
        onPress={() => {
          params.rightAction ? params.rightAction() : () => {}
        }}
      />
    }
  };


  datePickerReference : any;

  constructor(props) {
    super(props);

    if (props.scheduleId !== null && props.scheduleId !== undefined) {
      const store = props.store;
      const state = store.getState();
      const schedule = state.spheres[props.sphereId].stones[props.stoneId].schedules[props.scheduleId];
      let stateData = {...schedule, time: StoneUtil.crownstoneTimeToTimestamp(schedule.time)};

      // we do not want to copy the updatedAt since updates to the data SHOULD update this time in the cloud.
      delete stateData['updatedAt'];

      stateData.activeDays = {...schedule.activeDays};
      this.state = stateData;
    }
    else {
      this.state = {
        label: '',
        time: new Date().valueOf(),
        switchState: 1,
        fadeDuration: 0,
        ignoreLocationTriggers: false,
        intervalInMinutes: 0,
        active: true,
        repeatMode: '24h', // 24h / minute
        activeDays: {
          Mon: true,
          Tue: true,
          Wed: true,
          Thu: true,
          Fri: true,
          Sat: false,
          Sun: false,
        },
      }
    }

    if (this.props.scheduleId) {
      this.props.navigation.setParams({rightAction: () => {
          this._handleTime()
            .then(() => {this._updateSchedule(); })
            .catch((err) => { LOGe.info("DeviceScheduleEdit: Could not get time.", err); })
        }})
    }
    else {
      this.props.navigation.setParams({rightAction: () => {
          this._handleTime()
            .then(() => {this._createSchedule(); })
            .catch((err) => { LOGe.info("DeviceScheduleEdit: Could not get time.", err); })
        }})
    }
  }

  _getAndroidUI() {
    let items = [];
    let state = this.props.store.getState();
    let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];

    items.push({type:'lightExplanation', label: lang("TAP_THE_TIME_TO_CHANGE_IT"), below: false});
    items.push({__item:
      <TouchableOpacity style={{
        flexDirection:'row',
        width:screenWidth,
        height:100,
        backgroundColor: colors.white.rgba(0.75),
        padding:15,
        alignItems:'center'
      }} onPress={() => {
        TimePickerAndroid.open({
          hour: new Date(this.state.time).getHours(),
          minute: new Date(this.state.time).getMinutes(),
          is24Hour: true,
        })
          .then((data) => {
            if (data.action === 'timeSetAction') {
              let timeToday = new Date(new Date().setHours(data.hour)).setMinutes(data.minute);
              this.setState({time: timeToday.valueOf() });
            }
          })
          .catch((err) => { LOGe.info("DeviceScheduleEdit: Could not pick time for android.", err) })
      }}>
        <Text style={{flex:1, fontSize:55, fontWeight: '500', color:colors.black.rgba(0.6) }}>
          {Util.getTimeFormat(this.state.time, false)}
        </Text>
      </TouchableOpacity>
    });

    this._addSharedUIToItems(items, stone);

    return <ListEditableItems items={items} style={{width:screenWidth}} />
  }

  _getIosUI() {
    let items = [];
    let state = this.props.store.getState();
    let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];

    items.push({label: lang("PICK_A_TIME"), type: 'lightExplanation',  below:false});
    items.push({__item:
      <UncontrolledDatePickerIOS
        ref={(x) => { this.datePickerReference = x; }}
        date={new Date(this.state.time)}
        mode="time"
        style={{backgroundColor:colors.white.rgba(0.75), width:screenWidth, height:210}}
      />
    });

    this._addSharedUIToItems(items, stone);

    return <ListEditableItems items={items} style={{width:screenWidth}} />
  }

  _addSharedUIToItems(items, stone) {
    items.push({label: lang("Label"), type: 'textEdit', placeholder:lang("_optional_"), value: this.state.label, callback: (newText) => {
      this.setState({label:newText});
    }});
    items.push({label: lang("ACTION"), type: 'lightExplanation',  below:false});
    items.push({
      type: 'dropdown',
      label: lang("Turn_the_Crownstone__"),
      dropdownHeight: 130,
      valueRight: true,
      buttons: 2,
      valueStyle: {color: colors.darkGray2.hex, textAlign: 'right', fontSize: 15},
      value: this.state.switchState,
      items: [{label: lang("On"), value:1}, {label: lang("Off"), value:0}],
      callback: (newValue) => {
        this.setState({switchState: newValue})
      }
    });


    items.push({label: lang("REPEAT"), type: 'lightExplanation',  below:false});
    items.push({__item:
      <RepeatWeekday data={this.state.activeDays} onChange={(newData) => { this.setState({activeDays: newData}); }} />
    });

    if (this.props.scheduleId !== null && this.props.scheduleId !== undefined) {
      items.push({label: lang("SCHEDULING_OPTIONS"), type: 'lightExplanation',  below:false});
      items.push({label: lang("Schedule_active"), type: 'switch', value: this.state.active, callback: (newValue) => {
        this.setState({active: newValue});
      }});

      items.push({
        label: lang("Remove"),
        icon: <IconButton name="ios-trash" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
        type: 'button',
        callback: () => {
          if (Permissions.inSphere(this.props.sphereId).canDeleteSchedule === false) {
            Alert.alert(
lang("_Permission_Denied___You__header"),
lang("_Permission_Denied___You__body"),
[{text:lang("_Permission_Denied___You__left")}]);
            return;
          }


          if (stone.reachability.disabled === true) {
            Alert.alert(
lang("_Cant_see_Crownstone__You_header"),
lang("_Cant_see_Crownstone__You_body"),
[{text:lang("_Cant_see_Crownstone__You_left")}]
            );
            return;
          }
          else if (stone.schedules[this.props.scheduleId].active === false) {
            Alert.alert(
lang("_Are_you_sure___Remove_sc_header"),
lang("_Are_you_sure___Remove_sc_body"),
[{text: lang("_Are_you_sure___Remove_sc_left"), style: 'cancel'}, {
text: lang("_Are_you_sure___Remove_sc_right"), style:'destructive', onPress: () => {
                BackAction();
                this.props.store.dispatch({type:"REMOVE_STONE_SCHEDULE", sphereId: this.props.sphereId, stoneId: this.props.stoneId, scheduleId: this.props.scheduleId});
              }}]
            )
          }
          else {
            Alert.alert(
lang("_Are_you_sure___Removing__header"),
lang("_Are_you_sure___Removing__body"),
[{text: lang("_Are_you_sure___Removing__left"), style: 'cancel'}, {
text: lang("_Are_you_sure___Removing__right"), style:'destructive', onPress: () => {
                let state = this.props.store.getState();
                let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
                let schedule = stone.schedules[this.props.scheduleId];
                this._deleteSchedule(stone, schedule);
              }}]
            )
          }
      }});
    }
    items.push({type: 'spacer'});

    return items;
  }

  _validate() {
    let activeDay = false;
    for (let i = 0; i < DAYS.length; i++) {
      if (this.state.activeDays[DAYS[i]] === true) {
        activeDay = true; break;
      }
    }

    if (activeDay === false) {
      Alert.alert(
lang("_Pick_a_day___You_need_to_header"),
lang("_Pick_a_day___You_need_to_body"),
[{text:lang("_Pick_a_day___You_need_to_left")}]);
    }
    return activeDay;
  }

  _handleTime() {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'ios') {
        this.datePickerReference.getDate((date) => {
          this.setState({ time: date.valueOf() }, resolve);
        });
      }
      else {
        resolve();
      }
    });
  }

  _createSchedule() {
    let validated = this._validate();
    if (validated) {
      let state = this.props.store.getState();
      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
      this._addScheduleEntry(
        stone,
        this._getBridgeFormat(null),
        {
          loadingLabel: lang("Setting_the_Schedule_on_t"),
          alertLabel:  lang("I_could_not_set_the_Sched"),
          fullLabel: lang("You_cant_have_any_more_sc"),
          actionType: 'ADD_STONE_SCHEDULE',
          scheduleId: xUtil.getUUID(),
        }
      );
    }
  }

  _updateSchedule() {
    if (this.props.scheduleId) {
      // check for changes:
      let changed = false;
      let state = this.props.store.getState();
      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
      let schedule = stone.schedules[this.props.scheduleId];
      for (let i = 0; i < DAYS.length; i++) {
        if (schedule.activeDays[DAYS[i]] !== this.state.activeDays[DAYS[i]]) {
          changed = true; break;
        }
      }

      if (
        schedule.active !== this.state.active ||
        schedule.switchState !== this.state.switchState ||
        Util.getTimeFormat(StoneUtil.crownstoneTimeToTimestamp(schedule.time)) !== Util.getTimeFormat(this.state.time) ||
        schedule.fadeDuration !== this.state.fadeDuration ||
        schedule.intervalInMinutes !== this.state.intervalInMinutes ||
        schedule.ignoreLocationTriggers !== this.state.ignoreLocationTriggers ||
        schedule.repeatMode !== this.state.repeatMode
      ) {
        changed = true;
      }

      if (changed) {
        if (stone.reachability.disabled === true) {
          Alert.alert(
lang("_Cant_see_Crownstone__You__header"),
lang("_Cant_see_Crownstone__You__body"),
[{text:lang("_Cant_see_Crownstone__You__left"), onPress: () => { BackAction();}}],
            {cancelable: false}
          );
          return;
        }
        if (schedule.active === true && this.state.active === false) {
          // disable schedule entry
          this._disableSchedule(stone, schedule);
        }
        else if (schedule.active === false && this.state.active === true) {
          // enable entry means get new available entry and set it there.
          this._addScheduleEntry(
            stone,
            this._getBridgeFormat(null),
            {
              loadingLabel: lang("Activating_the_Schedule_o"),
              alertLabel:  lang("I_could_not_activate_the_"),
              fullLabel: lang("You_cant_have_any_more_sc"),
              actionType: 'UPDATE_STONE_SCHEDULE',
              scheduleId: this.props.scheduleId,
            }
          );
        }
        else if (schedule.active === false && this.state.active === false) {
          // schedule is not active, just set it in the database
          this.props.store.dispatch({
            type: "UPDATE_STONE_SCHEDULE",
            sphereId: this.props.sphereId,
            stoneId: this.props.stoneId,
            scheduleId: this.props.scheduleId,
            data: {...this.state, time: ScheduleUtil.getNextTime(this.state.time, this.state.activeDays)}
          });
          BackAction();
        }
        else {
          // schedule is active, tell the Crownstone to update it.
          this._updateScheduleEntry(stone, this._getBridgeFormat(schedule.scheduleEntryIndex));
        }
      }
      else {
        this.props.store.dispatch({
          type: "UPDATE_STONE_SCHEDULE",
          sphereId: this.props.sphereId,
          stoneId: this.props.stoneId,
          scheduleId: this.props.scheduleId,
          data: {...this.state, time: ScheduleUtil.getNextTime(this.state.time, this.state.activeDays)}
        });
        BackAction();
      }
    }
    else {
      LOGe.info("DeviceScheduleEdit: _updateSchedule should not be called without this.props.scheduleId");
      BackAction();
    }
  }

  _getBridgeFormat(scheduleEntryIndex) {
    let stateCopy:any = {...this.state};
    stateCopy.scheduleEntryIndex = scheduleEntryIndex;
    stateCopy.repeatMode = this._getRepeatMode();
    return ScheduleUtil.getBridgeFormat(stateCopy);
  }


  _getRepeatMode() {
    if (this.state.intervalInMinutes > 0) {
      return 'minute';
    }
    else if (this.state.repeatMode === "none") {
      return 'none';
    }
    else {
      return '24h';
    }
  }

  _addScheduleEntry(stone, scheduleConfig, config) {
    this.props.eventBus.emit("showLoading", config.loadingLabel);
    BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, { commandName : 'addSchedule', scheduleConfig: scheduleConfig })
      .then((scheduleEntryIndex : {data: string}) => {
        this.props.eventBus.emit("showLoading", "Done!");
        Scheduler.scheduleCallback(() => {
          this.props.eventBus.emit("hideLoading");
          this.props.store.dispatch({
            type: config.actionType,
            sphereId: this.props.sphereId,
            stoneId: this.props.stoneId,
            scheduleId: config.scheduleId,
            data: {scheduleEntryIndex:scheduleEntryIndex.data, ...this.state, time: ScheduleUtil.getNextTime(this.state.time, this.state.activeDays) }
          });
          BackAction();
        }, 500, 'Deactivate Schedule UI callback');
      })
      .catch((err) => {
        if (err === "NO_SCHEDULE_ENTRIES_AVAILABLE")  {
          Alert.alert(
lang("_Schedules_are_full__argu_header"),
lang("_Schedules_are_full__argu_body",config.fullLabel),
[{text:lang("_Schedules_are_full__argu_left"), onPress:() => { this.props.eventBus.emit("hideLoading"); }}, {
text:lang("_Schedules_are_full__argu_right"), onPress: () => { this._addScheduleEntry(stone, scheduleConfig, config); } }],
            {cancelable: false}
          )
        }
        else {
          Alert.alert(
lang("_Whoops__arguments___No___header"),
lang("_Whoops__arguments___No___body",config.alertLabel),
[{text:lang("_Whoops__arguments___No___left"), onPress:() => { this.props.eventBus.emit("hideLoading"); }}, {
text:lang("_Whoops__arguments___No___right"), onPress: () => { this._addScheduleEntry(stone, scheduleConfig, config); } }],
            {cancelable: false}
          )
        }
      });
    BatchCommandHandler.load(stone, this.props.stoneId, this.props.sphereId, { commandName : 'setTime', time: StoneUtil.nowToCrownstoneTime() }).catch(() => {});
    BatchCommandHandler.executePriority();
  }

  _updateScheduleEntry(stone, scheduleConfig) {
    this.props.eventBus.emit("showLoading", 'Updating this Schedule on the Crownstone!');
    BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, { commandName : 'setSchedule', scheduleConfig: scheduleConfig })
      .then(() => {
        this.props.eventBus.emit("showLoading", "Done!");
        Scheduler.scheduleCallback(() => {
          this.props.eventBus.emit("hideLoading");
          this.props.store.dispatch({
            type: 'UPDATE_STONE_SCHEDULE',
            sphereId: this.props.sphereId,
            stoneId: this.props.stoneId,
            scheduleId: this.props.scheduleId,
            data: {...this.state, time: ScheduleUtil.getNextTime(this.state.time, this.state.activeDays)}
          });
          BackAction();
        }, 500, 'Update Schedule UI callback');
      })
      .catch((err) => {
        Alert.alert(
lang("_Whoops___I_could_not_tel_header"),
lang("_Whoops___I_could_not_tel_body"),
[{text:lang("_Whoops___I_could_not_tel_left"), onPress:() => { this.props.eventBus.emit("hideLoading"); }}, {
text:lang("_Whoops___I_could_not_tel_right"), onPress: () => { this._updateScheduleEntry(stone, scheduleConfig); } }],
          {cancelable: false}
        )
      });
    BatchCommandHandler.load(stone, this.props.stoneId, this.props.sphereId, { commandName : 'setTime', time: StoneUtil.nowToCrownstoneTime() }).catch(() => {});
    BatchCommandHandler.executePriority();
  }

  _disableSchedule(stone, schedule) {
    this.props.eventBus.emit("showLoading", "Deactivating Schedule on Crownstone!");
    BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, { commandName : 'clearSchedule', scheduleEntryIndex: schedule.scheduleEntryIndex })
      .then(() => {
        this.props.eventBus.emit("showLoading", "Done!");
        Scheduler.scheduleCallback(() => {
          this.props.eventBus.emit("hideLoading");
          this.props.store.dispatch({
            type: "UPDATE_STONE_SCHEDULE",
            sphereId: this.props.sphereId,
            stoneId: this.props.stoneId,
            scheduleId: this.props.scheduleId,
            data: {...this.state, time: ScheduleUtil.getNextTime(this.state.time, this.state.activeDays)}
          });
          BackAction();
        }, 500, 'Deactivate Schedule UI callback');
      })
      .catch(() => {
        Alert.alert(
lang("_Whoops___I_could_not_tell_header"),
lang("_Whoops___I_could_not_tell_body"),
[{text:lang("_Whoops___I_could_not_tell_left"), onPress:() => { this.props.eventBus.emit("hideLoading"); BackAction(); }}, {
text:lang("_Whoops___I_could_not_tell_right"), onPress: () => { this._disableSchedule(stone, schedule); } }],
          {cancelable: false}
        )
      });
    BatchCommandHandler.executePriority();
  }

  _deleteSchedule(stone, schedule) {
    this.props.eventBus.emit("showLoading", "Removing Schedule from Crownstone!");
    BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, { commandName : 'clearSchedule', scheduleEntryIndex: schedule.scheduleEntryIndex })
      .then(() => {
        this.props.eventBus.emit("showLoading", "Done!");
        Scheduler.scheduleCallback(() => {
          this.props.eventBus.emit("hideLoading");
          this.props.store.dispatch({type:"REMOVE_STONE_SCHEDULE", sphereId: this.props.sphereId, stoneId: this.props.stoneId, scheduleId: this.props.scheduleId});
          BackAction();
        }, 500, 'Disable Schedule UI callback');
      })
      .catch(() => {
        Alert.alert(
lang("_Whoops___I_could_not_tell__header"),
lang("_Whoops___I_could_not_tell__body"),
[{text:lang("_Whoops___I_could_not_tell__left"), onPress:() => { this.props.eventBus.emit("hideLoading"); BackAction(); }}, {
text:lang("_Whoops___I_could_not_tell__right"), onPress: () => { this._deleteSchedule(stone, schedule); } }],
          {cancelable: false}
        )
      });
    BatchCommandHandler.executePriority();
  }

  render() {
    return (
      <Background hasNavBar={false} image={this.props.backgrounds.detailsDark}>
        <OrangeLine/>
        <ScrollView style={{flex:1}}>
          <View style={{alignItems:'center', width: screenWidth}}>
            { Platform.OS === 'android' ? this._getAndroidUI() : this._getIosUI() }
          </View>
        </ScrollView>
      </Background>
    );
  }
}

class RepeatWeekday extends Component<any, any> {
  _getDays(size) {
    let localizedDays = [lang("DAY_Mon"), lang("DAY_Tue"), lang("DAY_Wed"), lang("DAY_Thu"), lang("DAY_Fri"), lang("DAY_Sat"), lang("DAY_Sun")];
    let items = [];

    items.push(<View key={'selectableDayFlexStart'} style={{flex:1}} />);
    for (let i = 0; i < DAYS.length; i++) {
      items.push(
        <TouchableOpacity
          key={'selectableDay'+i}
          onPress={() => {
            let newState = {...this.props.data};
            newState[DAYS[i]] = !this.props.data[DAYS[i]];
            this.props.onChange(newState);
          }}
          style={{
            width: size,
            height: size,
            borderRadius: 0.5*size,
            backgroundColor: this.props.data[DAYS[i]] ? colors.green.hex : colors.darkBackground.rgba(0.2),
            alignItems:'center',
            justifyContent:'center'
          }}
        >
          <Text style={{
            fontSize:11,
            fontWeight: this.props.data[DAYS[i]] ? 'bold' : '300',
            color: this.props.data[DAYS[i]] ? colors.white.hex : colors.darkBackground.rgba(0.6),
            backgroundColor:"transparent"
          }}>{localizedDays[i]}</Text>
        </TouchableOpacity>
      );
      items.push(<View key={'selectableDayFlex'+i} style={{flex:1}} />)
    }

    return items;
  }

  render() {
    let size = screenWidth/10;
    return (
      <View style={{
        height: size*1.5,
        width: screenWidth,
        backgroundColor: colors.white.hex,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center'
      }}>
        { this._getDays(size) }
      </View>
    )
  }
}
