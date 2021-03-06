import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereEditSettings", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';
import {Actions} from "react-native-router-flux";
import {IconButton} from "../../components/IconButton";
import {Util} from "../../../util/Util";
import {colors, OrangeLine} from "../../styles";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {CLOUD} from "../../../cloud/cloudAPI";
import {BackAction} from "../../../util/Back";
import {Bluenet} from "../../../native/libInterface/Bluenet";
import {getStonesAndAppliancesInSphere} from "../../../util/DataUtil";
import {Background} from "../../components/Background";
import {ListEditableItems} from "../../components/ListEditableItems";

export class SphereEditSettings extends LiveComponent<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: lang("Sphere_Menu"),
      headerTruncatedBackTitle: lang("Back"),
    }
  };

  deleting : boolean;
  validationState : any;
  unsubscribeStoreEvents : any;

  constructor(props) {
    super(props);

    const state = props.store.getState();
    let sphereSettings = state.spheres[props.sphereId].config;

    this.state = {sphereName: sphereSettings.name};
    this.deleting = false;
    this.validationState = {sphereName:'valid'};
  }

  componentDidMount() {
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (
        change.changeSpheres      && change.changeSpheres.sphereIds[this.props.sphereId]      ||
        change.changeSphereConfig && change.changeSphereConfig.sphereIds[this.props.sphereId]
      ) {
        if (this.deleting === false)
          this.forceUpdate();
      }
    });
  }


  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }


  _getItems() {
    let items = [];

    const store = this.props.store;
    const state = store.getState();

    let spherePermissions = Permissions.inSphere(this.props.sphereId);

    items.push({label: lang("SPHERE_DETAILS"),  type:'explanation', below:false});
    if (spherePermissions.editSphere) {
      let sphereSettings = state.spheres[this.props.sphereId].config;
      items.push({
        type:'textEdit',
        label: lang("Name"),
        value: this.state.sphereName,
        validation:{minLength:2},
        validationCallback: (result) => {this.validationState.sphereName = result;},
        callback: (newText) => {
          this.setState({sphereName: newText});
        },
        endCallback: (newText) => {
          if (sphereSettings.name !== newText) {
            if (this.validationState.sphereName === 'valid' && newText.trim().length >= 2) {
              this.props.eventBus.emit('showLoading', lang("Changing_sphere_name___"));
              CLOUD.forSphere(this.props.sphereId).changeSphereName(newText)
                .then((result) => {
                  store.dispatch({type: 'UPDATE_SPHERE_CONFIG', sphereId: this.props.sphereId,  data: {name: newText}});
                  this.props.eventBus.emit('hideLoading');
                })
                .catch((err) => {
                  this.props.eventBus.emit('hideLoading');
                })
            }
            else {
              Alert.alert(
lang("_Sphere_name_must_be_at_l_header"),
lang("_Sphere_name_must_be_at_l_body"),
[{text: lang("_Sphere_name_must_be_at_l_left")}]);
            }
          }
        }
      });
    }
    else {
      items.push({
        type:'info',
        label: lang("Name"),
        value: this.state.sphereName,
      });
    }

    let ai = Util.data.getAiData(state, this.props.sphereId);

    items.push({label: lang("PERSONAL_ARTIFICIAL_INTEL"),  type:'explanation', below:false});
    items.push({
      label: ai.name,
      type: spherePermissions.editSphere ? 'navigation' : 'info',
      icon: <IconButton name='c1-brain' size={21} radius={15} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green.hex}}/>,
      callback: () => {
        Actions.aiStart({sphereId: this.props.sphereId, canGoBack: true});
      }
    });
    items.push({label: lang("_will_do__very_best_help_",ai.name,ai.his),  type:'explanation', style:{paddingBottom:0}, below:true});


    items.push({label: lang("SPHERE_USERS"),  type:'explanation', below:false});
    items.push({
      label: lang("Manage_Sphere_Users"),
      type: 'navigation',
      icon: <IconButton name='c1-people' size={21} radius={15} button={true} color="#fff" buttonStyle={{backgroundColor: colors.menuTextSelected.hex}}/>,
      callback: () => {
        Actions.pop();
        setTimeout(() => { this.props.eventBus.emit("highlight_nav_field", "sphereEdit_users");}, 200)
        setTimeout(() => { Actions.sphereUserOverview({sphereId: this.props.sphereId}); }, 500);
      }
    });


    items.push({label: lang("DANGER"),  type:'explanation', below: false});
    items.push({
      label: lang("Leave_Sphere"),
      icon: <IconButton name="md-exit" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.menuRed.hex}} />,
      style: {color:colors.menuRed.hex},
      type: 'button',
      callback: () => {
        this._leaveSphere(state);
      }
    });
    if (spherePermissions.deleteSphere) {
      items.push({
        label: lang("Delete_Sphere"),
        icon: <IconButton name="md-exit" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.darkRed.hex}}/>,
        style: {color: colors.darkRed.hex},
        type: 'button',
        callback: () => {
          this._deleteSphere(state);
        }
      });
    }
    items.push({label: lang("This_cannot_be_undone_"),  type:'explanation', below: true});

    items.push({type:'spacer'});
    items.push({type:'spacer'});
    items.push({type:'spacer'});

    return items;
  }


  _leaveSphere(state) {
    Alert.alert(
lang("_Are_you_sure_you_want_to_header"),
lang("_Are_you_sure_you_want_to_body"),
[{text:lang("_Are_you_sure_you_want_to_left")},
        {
text:lang("_Are_you_sure_you_want_to_right"), onPress:() => {
            this.props.eventBus.emit('showLoading',lang("Removing_you_from_this_Sp"));
            CLOUD.forUser(state.user.userId).leaveSphere(this.props.sphereId)
              .then(() => {
                this._processLocalDeletion()
              })
              .catch((err) => {
                let explanation =  lang("Please_try_again_later_");
                if (err && err.data && err.data.error && err.data.error.message === "can't exit from sphere where user with id is the owner") {
                  explanation =  lang("You_are_the_owner_of_this");
                }

                this.props.eventBus.emit('hideLoading');
                Alert.alert("Could not leave Sphere!", explanation, [{text:"OK"}]);
              })
        }}
      ]
    );
  }

  _processLocalDeletion(){
    this.props.eventBus.emit('hideLoading');
    this.deleting = true;

    let state = this.props.store.getState();
    let actions = [];
    if (state.app.activeSphere === this.props.sphereId)
      actions.push({type:"CLEAR_ACTIVE_SPHERE"});

    actions.push({type:'REMOVE_SPHERE', sphereId: this.props.sphereId});

    // stop tracking sphere.
    Bluenet.stopTrackingIBeacon(state.spheres[this.props.sphereId].config.iBeaconUUID);
    this.props.store.batchDispatch(actions);
    BackAction('sphereOverview')
  }

  _deleteSphere(state) {
    Alert.alert(
lang("_Are_you_sure_you_want_to__header"),
lang("_Are_you_sure_you_want_to__body"),
[{text:lang("_Are_you_sure_you_want_to__left")},
        {
text:lang("_Are_you_sure_you_want_to__right"), onPress:() => {
          let stones = getStonesAndAppliancesInSphere(state, this.props.sphereId);
          let stoneIds = Object.keys(stones);
          if (stoneIds.length > 0) {
            Alert.alert(
              lang("Still_Crownstones_detecte"),
              lang("You_can_remove_then_by_go"),
              [{text:'OK'}]
            );
          }
          else {
            this.props.eventBus.emit('showLoading',lang("Removing_you_from_this_Sp"));
            CLOUD.forSphere(this.props.sphereId).deleteSphere()
              .then(() => {
                this._processLocalDeletion();
              })
              .catch((err) => {
                this.props.eventBus.emit('hideLoading');
                Alert.alert(
lang("_Could_not_delete_Sphere__header"),
lang("_Could_not_delete_Sphere__body"),
[{text:lang("_Could_not_delete_Sphere__left")}]);
              })
          }
        }}
      ]
    );
  }

  render() {
    return (
      <Background image={this.props.backgrounds.menu} hasNavBar={false} >
        <OrangeLine/>
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
