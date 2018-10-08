import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  Linking,
  TouchableOpacity,
  TouchableHighlight,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import {colors, OrangeLine, screenWidth} from "../styles";
import {IconButton} from "../components/IconButton";
import {Actions} from "react-native-router-flux";
import {Icon} from "../components/Icon";
import {NavigationBar} from "../components/editComponents/NavigationBar";
import { Sentry } from "react-native-sentry";

export class SettingsFAQ extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: Languages.title("SettingsFAQ", "FAQ")(),
    }
  };

  _getItems() {
    let items = [];

    let appStoreLabel =  Languages.label("SettingsFAQ", "App_Store")();
    if (Platform.OS === 'android') {
      appStoreLabel =  Languages.label("SettingsFAQ", "Play_Store")();
    }

    items.push({
      type:'largeExplanation',
      label: Languages.label("SettingsFAQ", "Frequently_Asked_Question")(),
    });

    items.push({
      type:'collapsable',
      label: Languages.label("SettingsFAQ", "____add_a_Crownstone_")(),
      content:Languages.label("SettingsFAQ","You_just_have_to_hold_it_")(),
      contentHeight: 175
    });

    items.push({
      type:'collapsable',
      label: Languages.label("SettingsFAQ", "____add_someone_to_my_Sph")(),
      content:Languages.label("SettingsFAQ","If_youre_an_Admin_or_Memb")(),
      contentHeight: 145
    });


    items.push({
      type:'collapsable',
      label: Languages.label("SettingsFAQ", "____create_a_room_")(),
      content: Languages.label("SettingsFAQ","You_need_to_be_an_admin_o")(),
      contentHeight: 175
    });

    items.push({
      type:'collapsable',
      label: Languages.label("SettingsFAQ", "____move_a_Crownstone_to_")(),
      content: Languages.label("SettingsFAQ","Moving_the_Crownstone_is_")(),
      contentHeight: 175
    });


    items.push({
      type:'collapsable',
      label: Languages.label("SettingsFAQ", "____dim_with_my_Crownston")(),
      content:Languages.label("SettingsFAQ","Make_sure_dimming_is_enab")(),
      contentHeight: 200
    });

    items.push({
      type:'collapsable',
      label: Languages.label("SettingsFAQ", "____use_indoor_localizati")(),
      content:Languages.label("SettingsFAQ","Indoor_localization_on_ro")(),
      contentHeight: 235
    });

    items.push({
      type:'collapsable',
      label: Languages.label("SettingsFAQ", "____use_schedules_")(),
      content:Languages.label("SettingsFAQ","These_can_be_found_in_the")(),
      contentHeight: 175
    });

    items.push({
      type:'collapsable',
      label: Languages.label("SettingsFAQ", "____use_Switchcraft_")(),
      content: Languages.label("SettingsFAQ","Switchcraft_is_currently_")(),
      contentHeight: 275
    });


    items.push({
      type:'largeExplanation',
      label: Languages.label("SettingsFAQ", "What_to_do_if____")(),
    });

    items.push({
      type:'collapsable',
      label: Languages.label("SettingsFAQ", "____a_new_Crownstone_wont")(),
      content:Languages.label("SettingsFAQ","Make_sure_the_Crownstone_")(),
      contentHeight: 175
    });

    items.push({
      type:'collapsable',
      label: Languages.label("SettingsFAQ", "____a_Crownstone_is_on_Se")(),
      content:"Ensure there is power on the Crownstone and that you can reach it.\n\n" +
      "If you're near (within a meter) and it is still on 'Searching' you may want to try the factory reset procedure (see 'what to do if I need to factory reset a Crownstone' below).",
      contentHeight: 155
    });

    items.push({
      type:'collapsable',
      label: Languages.label("SettingsFAQ", "____I_want_to_have_a_clea")(),
      contentItem:
        <View style={{flex:1}}>
          <Text style={{paddingLeft:25, paddingRight: 15, paddingTop: 10}}>{ Languages.text("SettingsFAQ", "Sometimes_something_goes_")() }</Text>
          <View style={{flex:1}} />
          <NavigationBar
            label={ Languages.label("SettingsFAQ", "Revert_to_Cloud_Data")()}
            icon={<IconButton name={'md-cloud-download'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.red.hex }}/>}
            callback={() => {
              Actions.settingsRedownloadFromCloud()
            }}
          />
          <View style={{flex:1}} />
        </View>,
      contentHeight: 200
    });

    items.push({
      type:'collapsable',
      label: Languages.label("SettingsFAQ", "____my_Sphere_name_is_gon")(),
      contentItem:
        <View style={{flex:1}}>
          <Text style={{paddingLeft:25, paddingRight: 15, paddingTop: 10}}>{ Languages.text("SettingsFAQ", "Sometimes_something_goes_w")() }</Text>
          <View style={{flex:1}} />
          <NavigationBar
            label={ Languages.label("SettingsFAQ", "Revert_to_Cloud_Data")()}
            icon={<IconButton name={'md-cloud-download'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.red.hex }}/>}
            callback={() => {
              Actions.settingsRedownloadFromCloud()
            }}
          />
          <View style={{flex:1}} />
        </View>,
      contentHeight: 200
    });

    items.push({
      type:'collapsable',
      label: Languages.label("SettingsFAQ", "____it_always_says_No_Cro")(),
      contentItem:
        <View style={{flex:1}}>
          <Text style={{paddingLeft:25, paddingRight: 15, paddingTop: 10}}>{ Languages.text("SettingsFAQ", "It_could_be_that_youre_no")() }</Text>
          <View style={{flex:1}} />
          <NavigationBar
            label={ Languages.label("SettingsFAQ", "Revert_to_Cloud_Data")()}
            icon={<IconButton name={'md-cloud-download'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.red.hex }}/>}
            callback={() => {
              Actions.settingsRedownloadFromCloud()
            }}
          />
          <View style={{flex:1}} />
        </View>,
      contentHeight: 275
    });

    let label =  Languages.label("SettingsFAQ", "If_that_fails__quit_the_a")();
    if (Platform.OS === 'android') {
      label =  Languages.label("SettingsFAQ", "If_that_fails__quit_the_ap")();
    }
    items.push({
      type:'collapsable',
      label: Languages.label("SettingsFAQ", "____the_setup_process_fai")(),
      content: Languages.label("SettingsFAQ","Retry_a_few_times___If_th")(label, appStoreLabel),
      contentHeight: 245
    });

    items.push({
      type:'collapsable',
      label: Languages.label("SettingsFAQ", "____a_Crownstone_toggles_")(),
      content:Languages.label("SettingsFAQ","This_could_happen_due_to_")(),
      contentHeight: 225
    });


    items.push({
      type:'collapsable',
      label: Languages.label("SettingsFAQ", "____I_need_to_factory_res")(),
      contentItem:
        <View style={{flex:1}}>
          <Text style={{paddingLeft:25, paddingRight: 15, paddingTop: 10}}>{ Languages.text("SettingsFAQ", "Only_use_this_as_a_last_r")() }</Text>
          <View style={{flex:1}} />
          <NavigationBar
            label={ Languages.label("SettingsFAQ", "Reset_Crownstone")()}
            icon={<IconButton name={'ios-build'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.red.hex }}/>}
            callback={() => {
              Actions.settingsFactoryResetStep1()
            }}
          />
          <View style={{flex:1}} />
        </View>,
      contentHeight: 175
    });

    items.push({
      type:'largeExplanation',
      label: Languages.label("SettingsFAQ", "Solve_most_BLE_issues")(),
    });

    items.push({
      id:'Troubleshooting',
      label: Languages.label("SettingsFAQ", "BLE_Troubleshooting")(),
      type:'navigation',
      icon: <IconButton name={'ios-bluetooth'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.blue.hex }}/>,
      callback: () => {
        Actions.settingsBleTroubleshooting()
      }
    });
    items.push({
      type:'largeExplanation',
      label: Languages.label("SettingsFAQ", "More_help_is_available_on")(),
    });

    items.push({
      id:'Help',
      label: Languages.label("SettingsFAQ", "Help")(),
      type:'navigation',
      icon: <IconButton name={'ios-cloudy'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.green.hex }}/>,
      callback: () => {
        Linking.openURL('https://crownstone.rocks/app-help/').catch(err => {});
      }
    });

    items.push({
      type:'spacer',
    });

    return items;
  }

  render() {
    return (
      <Background image={this.props.backgrounds.menu} >
        <OrangeLine/>
        <ScrollView>
          <ListEditableItems items={this._getItems()} separatorIndent={false} />
        </ScrollView>
      </Background>
    );
  }
}
