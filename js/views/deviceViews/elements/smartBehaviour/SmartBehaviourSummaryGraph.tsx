import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { Icon } from "../../../components/Icon";
import { colors, screenWidth } from "../../../styles";
import { eventBus } from "../../../../util/EventBus";
import { Util } from "../../../../util/Util";


export class SmartBehaviourSummaryGraph extends Component<any, any> {
  id;
  constructor(props) {
    super(props);

    this.id = Util.getShortUUID();
  }

  render() {
    return (
      <View style={{flexDirection:'row', width:screenWidth, height:90}}>
        <View style={{flex:1}} />
        <TouchableWithoutFeedback style={{width:screenWidth*0.8, height:100}} onPress={() => { eventBus.emit("TOUCHED_SMART_BEHAVIOUR_SUMMARY_GRAPH"+this.id)}}>
          <View style={{width:screenWidth*0.8, height:100}}>
            <DayNightIndicator id={this.id} />
            <View style={{postion:'absolute', left:0, top:15, width:screenWidth*0.8, height:75}}>
              <SmartBehaviourSummaryGraphElement dataColor={colors.green.hex}       icon={'md-power'}        iconSize={17} times={[{start:'15:30', end:'22:00'}]} id={this.id} explanation={"When I will be on."} />
              <SmartBehaviourSummaryGraphElement dataColor={colors.csBlue.hex}      icon={'c1-locationPin1'} iconSize={14} times={[{start:'23:00', end:'8:00'}]}  id={this.id} explanation={"When I'll be on based on presence."} />
              <SmartBehaviourSummaryGraphElement dataColor={colors.blinkColor2.hex} icon={'ios-leaf'}        iconSize={17} times={[{start:'20:30', end:'5:00'}]}  id={this.id} explanation={"When twilight mode is active."} />
            </View>
            <TimeSelector id={this.id} />
          </View>
        </TouchableWithoutFeedback>
        <View style={{flex:1}} />
      </View>
    )
  }
}



class SmartBehaviourSummaryGraphElement extends Component<any, any> {
  padding = 5;
  lineHeight = 10;
  itemHeight = 18;
  iconWidth = 18;
  keyCount = 0;

  explanationVisible = false
  unsubscribe = null
  width = null;

  constructor(props) {
    super(props);

    this.width = screenWidth*0.8 - this.iconWidth - this.padding;

    this.state = {
      explanationOpacity: new Animated.Value(0),
      explanationWidth:   new Animated.Value(0),
    }

  }

  componentDidMount(): void {
    this.unsubscribe = eventBus.on("TOUCHED_SMART_BEHAVIOUR_SUMMARY_GRAPH" + this.props.id, () => { this.toggleExplanation() })
  }

  componentWillUnmount(): void {
    this.unsubscribe()
  }


  toggleExplanation() {
    if (this.explanationVisible) {
      // hide
      let animations = [];
      animations.push(Animated.timing(this.state.explanationOpacity, {toValue: 0, delay:10, duration:200}));
      animations.push(Animated.timing(this.state.explanationWidth,   {toValue: 0, delay:0,  duration:200}));
      Animated.parallel(animations).start(() => { this.explanationVisible = false; });
    }
    else {
      // show
      let animations = [];
      animations.push(Animated.timing(this.state.explanationOpacity, {toValue: 1,          delay:10, duration:200}));
      animations.push(Animated.timing(this.state.explanationWidth,   {toValue: this.width, delay:0,  duration:200}));
      Animated.parallel(animations).start(() => { this.explanationVisible = true; });
    }
  }

  getSubItem(startMinutes, endMinutes) {
    let width = this.width;

    let startX = width * startMinutes / (24*60)
    let endX   = width * endMinutes   / (24*60)

    return (
      <View
        key={this.keyCount++}
        style={{
          position:        'absolute',
          top:             0.5*(this.itemHeight-this.lineHeight),
          left:            this.iconWidth + this.padding + startX,
          width:           endX - startX,
          height:          this.lineHeight,
          borderRadius:    0.5*this.lineHeight,
          backgroundColor: this.props.dataColor
        }} />
    )
  }

  getItem(start, end) {
    let startMinutes = getMinutes(start);
    let endMinutes = getMinutes(end);

    if (endMinutes < startMinutes) {
      // we need 2 parts
      return [
        this.getSubItem(startMinutes, getMinutes("24:00")),
        this.getSubItem(getMinutes("00:00"), endMinutes),
      ]
    }
    if (endMinutes == startMinutes) {
      return [this.getSubItem(getMinutes("00:00"), getMinutes("24:00"))]
    }
    else {
      return [this.getSubItem(startMinutes, endMinutes)]
    }

  }

  getElements() {
    this.keyCount = 0;
    let elements = [];

    this.props.times.forEach((time) => {
      elements = elements.concat(this.getItem(time.start, time.end))
    })

    return elements
  }

  render() {
    return (
      <View style={{flexDirection:'row', height: this.itemHeight, alignItems:'center',}}>
        <View style={{alignItems:'center', justifyContent:'center', width: this.iconWidth, height:this.itemHeight}}>
          <Icon name={this.props.icon} size={this.props.iconSize} color={"#fff"} />
        </View>
        <View style={{
          position: 'absolute', top: 0.5*(this.itemHeight-this.lineHeight), left: this.iconWidth + this.padding,
          width: this.width, height: this.lineHeight,
          borderRadius: 0.5*this.lineHeight, backgroundColor:colors.white.rgba(0.2)
        }} />
        {this.getElements()}
        <Animated.View style={{
          position:'absolute',
          left: this.iconWidth + this.padding,
          top:2,
          width: this.state.explanationWidth,
          height: this.itemHeight - 3,
          borderRadius: 8,
          backgroundColor:colors.white.hex,
          opacity: this.state.explanationOpacity
        }}>
          <Text style={explanationStyle(this.width)}>{this.props.explanation}</Text>
        </Animated.View>
      </View>
    )
  }
}


class TimeSelector extends Component<any, any> {
  explanationVisible = false
  unsubscribe = null
  width = null;

  constructor(props) {
    super(props);

    this.width = 50;

    this.state = {
      explanationOpacity: new Animated.Value(0),
      timeOpacity:        new Animated.Value(1),
      explanationWidth:   new Animated.Value(0),
    }
  }

  componentDidMount(): void {
    this.unsubscribe = eventBus.on("TOUCHED_SMART_BEHAVIOUR_SUMMARY_GRAPH" + this.props.id, () => { this.toggleExplanation() })
  }

  componentWillUnmount(): void {
    this.unsubscribe()
  }


  toggleExplanation() {
    if (this.explanationVisible) {
      // hide
      let animations = [];
      animations.push(Animated.timing(this.state.timeOpacity,        {toValue: 1, delay:50, duration:200}));
      animations.push(Animated.timing(this.state.explanationOpacity, {toValue: 0, delay:10, duration:200}));
      animations.push(Animated.timing(this.state.explanationWidth,   {toValue: 0, delay:0,  duration:200}));
      Animated.parallel(animations).start(() => { this.explanationVisible = false; });
    }
    else {
      // show
      let animations = [];
      animations.push(Animated.timing(this.state.timeOpacity,        {toValue: 0.2,        delay:50,  duration:200}));
      animations.push(Animated.timing(this.state.explanationOpacity, {toValue: 1,          delay:10, duration:200}));
      animations.push(Animated.timing(this.state.explanationWidth,   {toValue: this.width, delay:0,  duration:200}));
      Animated.parallel(animations).start(() => { this.explanationVisible = true; });
    }
  }


  render() {
    let width = 0.8*screenWidth - 25
    let time = "15:50";

    return (
      <View style={{position:'absolute', top:0, left: 25, width:width, height:90}}>
        <View style={{position:'absolute', top:0, left: width*(getMinutes(time)/(24*60)) - 20, width:40, height:12, alignItems:'center', justifyContent: 'center'}}>
          <Text style={{fontSize:9, color:colors.white.hex}}>{time}</Text>
        </View>
        <Animated.View style={{position:'absolute', top:0, left: width*(getMinutes(time)/(24*60)) - 20,
          width: this.state.explanationWidth, height:15,
          borderRadius: 8,
          backgroundColor:colors.white.hex,
          opacity: this.state.explanationOpacity,
          alignItems:'center', justifyContent: 'center'}}>
          <Text style={explanationStyle(this.width)}>Now</Text>
        </Animated.View>
        <Animated.View style={{position:'absolute', top:16, left: width*(getMinutes(time)/(24*60)) - 2, width:5, height:54, opacity: this.state.timeOpacity, borderRadius:2, backgroundColor: colors.white.rgba(0.4)}} />
        <Animated.View style={{position:'absolute', top:15, left: width*(getMinutes(time)/(24*60)),     width:1, height:56, opacity: this.state.timeOpacity, backgroundColor: colors.white.rgba(1)}} />
      </View>
    )
  }
}

class DayNightIndicator extends Component<any, any> {
  explanationVisible = false
  unsubscribe = null
  width = null;

  constructor(props) {
    super(props);

    this.width = 64;

    this.state = {
      explanationOpacity: new Animated.Value(0),
      explanationWidth: new Animated.Value(0),
    }

  }

  componentDidMount(): void {
    this.unsubscribe = eventBus.on("TOUCHED_SMART_BEHAVIOUR_SUMMARY_GRAPH" + this.props.id, () => { this.toggleExplanation() })
  }

  componentWillUnmount(): void {
    this.unsubscribe()
  }


  toggleExplanation() {
    if (this.explanationVisible) {
      // hide
      let animations = [];
      animations.push(Animated.timing(this.state.explanationOpacity, {toValue: 0, delay:10, duration:200}));
      animations.push(Animated.timing(this.state.explanationWidth,   {toValue: 0, delay:0,  duration:200}));
      Animated.parallel(animations).start(() => { this.explanationVisible = false; });
    }
    else {
      // show
      let animations = [];
      animations.push(Animated.timing(this.state.explanationOpacity, {toValue: 1,          delay:10, duration:200}));
      animations.push(Animated.timing(this.state.explanationWidth,   {toValue: this.width, delay:0,  duration:200}));
      Animated.parallel(animations).start(() => { this.explanationVisible = true; });
    }
  }

  render() {
    let width = 0.8*screenWidth - 25;

    let dawnLeft = width*(getMinutes("8:30")/(24*60));
    let duskLeft = width*(getMinutes("18:30")/(24*60));

    return (
      <View style={{position:'absolute', top:0, left: 25, width:width, height:90}}>
        <View style={{position:'absolute', top:29, left: dawnLeft, width:1, height:4, backgroundColor: colors.white.rgba(0.5)}} />
        <View style={{position:'absolute', top:29, left: duskLeft, width:1, height:4, backgroundColor: colors.white.rgba(0.5)}} />
        <View style={{position:'absolute', top:47, left: dawnLeft, width:1, height:4, backgroundColor: colors.white.rgba(0.5)}} />
        <View style={{position:'absolute', top:47, left: duskLeft, width:1, height:4, backgroundColor: colors.white.rgba(0.5)}} />
        <View style={{position:'absolute', top:65, left: dawnLeft, width:1, height:4, backgroundColor: colors.white.rgba(0.5)}} />
        <View style={{position:'absolute', top:65, left: duskLeft, width:1, height:4, backgroundColor: colors.white.rgba(0.5)}} />
        <View style={{position:'absolute', top:72, left: dawnLeft - 14, width:30, height:20, alignItems:'center', justifyContent: 'center'}}>
          <Icon name={"c1-sunrise"} size={20} color={"#fff"} />
        </View>
        <View style={{position:'absolute', top:72, left: duskLeft - 15, width:30, height:20, alignItems:'center', justifyContent: 'center'}}>
          <Icon name={"ios-cloudy-night"} size={18} color={"#fff"} />
        </View>
        <Animated.View style={{
          position:'absolute', top:73, left: dawnLeft - 32,
          width: this.state.explanationWidth, height:15,
          borderRadius: 8,
          backgroundColor:colors.white.hex,
          opacity: this.state.explanationOpacity
        }}>
          <Text style={explanationStyle(this.width)}>{"Sunrise"}</Text>
        </Animated.View>
        <Animated.View style={{
          position:'absolute', top:73, left: duskLeft - 32,
          width: this.state.explanationWidth, height:15,
          borderRadius: 8,
          backgroundColor:colors.white.hex,
          opacity: this.state.explanationOpacity
        }}>
          <Text style={explanationStyle(this.width)}>{"Sunset"}</Text>
        </Animated.View>
      </View>
    )
  }
}

function getMinutes(timeString) {
  // this is for times like 14:00
  let elements = timeString.split(":")
  return Number(elements[0]) * 60 + Number(elements[1])
}

const explanationStyle = (width) => { return {color: colors.csBlue.hex, fontWeight: 'bold', fontSize: 12, width: width, paddingLeft:10} }