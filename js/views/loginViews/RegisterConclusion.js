import React, {
  Alert,
  Component,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { Background } from './../components/Background'
var Actions = require('react-native-router-flux').Actions;
import loginStyles from './LoginStyles'
import { stylesIOS, colors } from './../styles'
let styles = stylesIOS;

export class RegisterConclusion extends Component {
  constructor() {
    super();
  }

  render() {
    let width = Dimensions.get('window').width;
    let buttonWidth = 0.5 * width;

    return (
      <Background hideTabBar={true} background={require('../../images/loginBackground.png')}>
        <View style={[style.viewContainer, {paddingTop:270}]}>
          <Text style={style.text}>An email has been sent to:</Text>
        </View>
        <View style={[style.viewContainer]}>
          <Text style={[style.text, {fontSize:21, fontWeight:'500'}]}>{this.props.email || 'thisismyemail@gmail.com'}</Text>
        </View>
        <View style={[style.viewContainer]}>
          <Text style={style.text}>After you click the validation link in the email,
            you can login to the app.
          </Text>
        </View>
        <View style={{
          flex:1,
          alignItems:'center',
          justifyContent:'center'}}>
          <TouchableOpacity onPress={Actions.loginSplash}>
            <View style={[loginStyles.loginButton, {width:buttonWidth}]}><Text style={loginStyles.loginText}>Got it!</Text></View>
          </TouchableOpacity>
        </View>
      </Background>
    );
  }
}

let style = StyleSheet.create({
  viewContainer: {
    backgroundColor:'transparent',
    alignItems:'center',
    justifyContent:'center',
    paddingLeft:15,
    paddingRight:15,
    padding:10
  },
  text: {
    textAlign:'center',
    color: '#fff',
    fontSize: 18
  }
});
