import React from 'react';
import {Image} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useNavigation} from '@react-navigation/native';
import {useRoute} from '@react-navigation/native';
import Chat from './Chat';
import Course from './Course';
import Translate from './Translate';
import Settings from './Setttings';
import Imagepath from './assets/Imagepath';

// Create a bottom tab navigator
const Tab = createBottomTabNavigator();

// Home screen component with bottom tabs
function Home() {
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email;
  
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Translate"
        component={Translate}
        initialParams={{email}}
        options={{headerShown: false, tabBarIcon:({focused})=>{
          return (
            <Image source={Imagepath.icTranslate}/>
          )
        }}}
      />
      <Tab.Screen
        name="Talk with AI"
        component={Chat}
        initialParams={{email}}
        options={{headerShown: false, tabBarIcon:({focused})=>{
          return (
            <Image source={Imagepath.icChat}/>
          )
        }}}
      />
      <Tab.Screen
        name="Course"
        component={Course}
        initialParams={{email}}
        options={{headerShown: false, tabBarIcon:({focused})=>{
          return (
            <Image source={Imagepath.icCourse}/>
          )
        }}}
      />
       <Tab.Screen
        name="Settings"
        component={Settings}
        initialParams={{email}}
        options={{headerShown: false, tabBarIcon:({focused})=>{
          return (
            <Image source={Imagepath.icSettings}/>
          )
        }}}
      />
    </Tab.Navigator>
  );
}

export default Home;
