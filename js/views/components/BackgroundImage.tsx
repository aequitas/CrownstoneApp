
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("BackgroundImage", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
} from 'react-native';
import {screenHeight, screenWidth, tabBarHeight, topBarHeight} from "../styles";

export class BackgroundImage extends Component<{height?: boolean, image: any}, any> {
  render() {
    return (
      <Image source={this.props.image} style={{width: screenWidth, height: this.props.height, resizeMode:'cover'}} />
    );
  }
}