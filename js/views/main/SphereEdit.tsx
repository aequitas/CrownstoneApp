import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;
import { Background }        from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { IconButton }        from '../components/IconButton'
import { colors }            from './../styles';
import {Permissions}         from "../../backgroundProcesses/PermissionManager";
import {OrangeLine}          from "../styles";
import {eventBus}            from "../../util/EventBus";
import {CLOUD}               from "../../cloud/cloudAPI";
import {createNewSphere} from "../../util/CreateSphere";

export class SphereEdit extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    let state = params.store.getState();
    if (params.sphereId) {
      let sphere = state.spheres[params.sphereId];
      if (sphere) {
        return {
          title: sphere.config.name,
        }
      }
    }

    return {
      title:Languages.title("SphereEdit", "Welcome_")()
    }
  };

  unsubscribe

  constructor(props) {
    super(props);

    this.state = {syncing: false}
  }

  componentDidMount() {
    this.unsubscribe = eventBus.on("CloudSyncComplete", () => {
      if (this.state.syncing) {
        this.setState({syncing: false})
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getItems() {
    let items = [];
    let state = this.props.store.getState();

    if (!this.props.sphereId || !state.spheres[this.props.sphereId]) {
      items.push({label:Languages.label("SphereEdit", "What_can_I_help_you_with_")()  type:'largeExplanation'});

      let radius = 12;

      items.push({
        label: 'Create Sphere',
        type: 'navigation',
        largeIcon: <IconButton name='c1-sphere' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green.hex}}/>,
        callback: () => {
          createNewSphere(eventBus, this.props.store, state.user.firstName+"'s Sphere")
            .then((sphereId) => {
              Actions.refresh({sphereId:sphereId})
              setTimeout(() => {Actions.aiStart()}, 100)
            })
            .catch((err) => {
              Alert("Whoops!", "Something went wrong with the creation of your Sphere.", [{text:"OK"}])
            });
        }
      });
      items.push({label:Languages.label("SphereEdit", "A_Sphere_contains_your_Cr")()  type:'explanation', below: true});
      return items;
    }

    let spherePermissions = Permissions.inSphere(this.props.sphereId);

    items.push({label:Languages.label("SphereEdit", "What_can_I_help_you_with_")()  type:'largeExplanation'});
    
    let radius = 12;

    items.push({
      label: 'Rooms',
      type: 'navigation',
      largeIcon: <IconButton name='md-cube' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green.hex}}/>,
      callback: () => {
        Actions.sphereRoomOverview({sphereId: this.props.sphereId});
      }
    });


    items.push({
      label: 'Crownstones',
      type: 'navigation',
      largeIcon: <IconButton name='c2-pluginFilled' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.purple.hex}}/>,
      callback: () => {
        Actions.sphereCrownstoneOverview({sphereId: this.props.sphereId});
      }
    });



    items.push({
      label: 'Users',
      type: 'navigation',
      largeIcon: <IconButton name='c1-people' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.menuTextSelected.hex}}/>,
      callback: () => {
        Actions.sphereUserOverview({sphereId: this.props.sphereId});
      }
    });

    if (spherePermissions.editSphere) {
      items.push({
        label: 'Behaviour',
        type: 'navigation',
        largeIcon: <IconButton name='c1-brain' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.csBlue.hex, marginLeft: 3, marginRight: 7}}/>,
        callback: () => {
          Actions.sphereBehaviour({sphereId: this.props.sphereId});
        }
      });
    }

    items.push({
      label: 'Integrations',
      type: 'navigation',
      largeIcon: <IconButton name='ios-link' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.darkBackground.hex}}/>,
      callback: () => {
        Actions.sphereIntegrations({sphereId: this.props.sphereId});
      }
    });

    items.push({type:'spacer'});
    items.push({
      label: 'Settings',
      largeIcon: <IconButton name="ios-cog" buttonSize={55} size={40} radius={radius} color="#fff" buttonStyle={{backgroundColor: colors.menuRed.hex}} />,
      type: 'navigation',
      callback: () => {
        Actions.sphereEditSettings({sphereId: this.props.sphereId});
      }
    });

    items.push({type:'spacer'});
    items.push({type:'spacer'});
    items.push({type:'spacer'});

    return items;
  }



  render() {
    return (
      <Background image={this.props.backgrounds.menu} hasNavBar={false} >
        <OrangeLine/>
        <ScrollView>
          <RefreshControl
            refreshing={this.state.syncing}
            onRefresh={() => { this.setState({syncing: true}); CLOUD.sync(this.props.store, true) }}
            title={"Syncing with the Cloud..."}
            titleColor={colors.darkGray.hex}
            colors={[colors.csBlue.hex]}
            tintColor={colors.csBlue.hex}
          />
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
