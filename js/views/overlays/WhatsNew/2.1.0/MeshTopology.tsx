
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("MeshTopology", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  StyleSheet,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {screenWidth} from "../../../styles";
import {WNStyles} from "../WhatsNewStyles";


export class MeshTopology extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 12*factor;
    return (
      <View style={{flex:1, paddingBottom:0, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={[WNStyles.outerScrollView,{width: this.props.width}]}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("Mesh_Topology_Visualizati") }</Text>
            <Image source={require('../../../../images/whatsNew/2.1.0/meshTopology.png')} style={{width:485*size, height:722*size, marginTop: 20, marginBottom: 20}} />
            <Text style={WNStyles.detail}>{ lang("Weve_added_a_visualisatio") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


