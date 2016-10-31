import React, { Component } from 'react'
import {
  Image,
  Text,
  View,
} from 'react-native';

import { FadeInView }         from './animated/FadeInView'
import { styles, colors , screenHeight, screenWidth } from './../styles'
import { eventBus } from '../../util/eventBus'

export class ViewOverlay extends Component {
  constructor() {
    super();
    this.state = {
      visible: false,
      children: undefined,
      backgroundColor: 'rgba(0,0,0,0.75)'
    };
    this.defaultColor = 'rgba(0,0,0,0.75)';
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on("showOverlay", (children, backgroundColor) => {
      if (!backgroundColor) {
        backgroundColor = this.defaultColor;
      }
      this.setState({visible: true, children: children, backgroundColor:backgroundColor});
    }));
    this.unsubscribe.push(eventBus.on("hideOverlay", () => {
      this.setState({visible: false});
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  render() {
    return (
      <FadeInView
        style={[styles.fullscreen, {backgroundColor:this.state.backgroundColor,justifyContent:'center', alignItems:'center'}]}
        height={screenHeight}
        duration={200}
        visible={this.state.visible}>
        {this.state.children}
      </FadeInView>
    );
  }
}