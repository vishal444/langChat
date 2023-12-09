import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import {useNavigation} from '@react-navigation/native'; // Import useNavigation
import {useRoute} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView } from 'react-native-gesture-handler';

const targetLang = [
  {label: 'English', value: 'English'},
  {label: 'German', value: 'German'},
  {label: 'French', value: 'French'},
  {label: 'Spanish', value: 'Spanish'},
  {label: 'Dutch', value: 'Dutch'},
  {label: 'Arabic', value: 'Arabic'},
  {label: 'Hindi', value: 'Hindi'},
];
const comfortableLang = [
  {label: 'English', value: 'English'},
  {label: 'German', value: 'German'},
  {label: 'French', value: 'French'},
  {label: 'Spanish', value: 'Spanish'},
  {label: 'Dutch', value: 'Dutch'},
  {label: 'Arabic', value: 'Arabic'},
  {label: 'Hindi', value: 'Hindi'},
];
const level = [
  {label: 'Beginner', value: 'Beginner'},
  {label: 'Intermediate', value: 'Intermediate'},
  {label: 'Proficient', value: 'Proficient'},
];
const voice = [
  {label: 'Male', value: 'alloy'},
  {label: 'Female', value: 'nova'},
];
const Start = () => {
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState(null);
  const [selectedComfLanguage, setSelectedComfLanguage] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null); // Initialize with a default value
  const [selectedVoice, setSelectedVoice] = useState(null);

  const route = useRoute(); // Get the route object
  const email = route.params?.email;

  const navigation = useNavigation();
   
  const handleOkButtonPress = async () => {
    const formData = new FormData();
    formData.append('comfLang', selectedComfLanguage);
    formData.append('targetLang', selectedTargetLanguage);
    formData.append('level', selectedLevel);
    formData.append('email', email);
    formData.append('voice', selectedVoice);
  
    try {
      const response = await fetch('http://127.0.0.1:5001/userData', {
        method: 'POST',
        body: formData,
      });
  
      if (response.status === 200) {
        // Update AsyncStorage only if the response status is 200
        await AsyncStorage.setItem('COMFLANGUAGE', `${selectedComfLanguage}`);
        await AsyncStorage.setItem('TARGETLANGUAGE', `${selectedTargetLanguage}`);
        await AsyncStorage.setItem('LEVEL', `${selectedLevel}`);
        // Redirect to the Home screen after successful registration
        navigation.navigate('Home', {
          email,
        });
      } else {
        console.log('Error:', response.status);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };
  

  const colorScheme = Appearance.getColorScheme();
  const styles = StyleSheet.create({
    backgroundStyle: {
      backgroundColor: colorScheme === 'light' ? 'white' : 'black',
      height: '100%'
    },
    button: {
      backgroundColor: colorScheme === 'light' ? 'black' : 'white',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
      marginTop: 20,
    },
    buttonText: {
      color: colorScheme === 'light' ? 'white' : 'black',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    displayText: {
      color: colorScheme === 'light' ? 'black' : 'white',
      fontSize: 18,
      marginTop: 20,
      fontWeight: 'bold',
    },
  });
  
  return (
    <SafeAreaView style={styles.backgroundStyle}>
    <ScrollView>
      <View >
        <Text style={[styles.displayText, { paddingVertical: 30 }]}>Select your comfortable language</Text>
        <Dropdown
          data={comfortableLang}
          search
          searchPlaceholder="Search"
          labelField="label"
          valueField="value"
          placeholder="Select language"
          value={selectedComfLanguage}
          onChange={item => setSelectedComfLanguage(item.value)}
          itemTextStyle={{ color: colorScheme === 'light' ? 'black' : 'black' }}
        />
        </View>
        <View >
        <Text style={[styles.displayText, { paddingVertical: 30 }]}>Select the language you want to learn</Text>
        <Dropdown
          data={targetLang}
          search
          searchPlaceholder="Search"
          labelField="label"
          valueField="value"
          placeholder="Select language"
          value={selectedTargetLanguage}
          onChange={item => setSelectedTargetLanguage(item.value)}
          itemTextStyle={{ color: colorScheme === 'light' ? 'black' : 'black' }}
        />
        </View>
        <View >
        <Text style={[styles.displayText, { paddingVertical: 30 }]}>Select your current proficiency level</Text>
        <Dropdown
          data={level}
          search
          searchPlaceholder="Search"
          labelField="label"
          valueField="value"
          placeholder="Select proficiency level"
          value={selectedLevel}
          onChange={item => setSelectedLevel(item.value)}
          itemTextStyle={{ color: colorScheme === 'light' ? 'black' : 'black' }}
        />
      </View>
      <View >
        <Text style={[styles.displayText, { paddingVertical: 30 }]}>Select your preferred voice</Text>
        <Dropdown
          data={voice}
          search
          searchPlaceholder="Search"
          labelField="label"
          valueField="value"
          placeholder="Select voice"
          value={selectedVoice}
          onChange={item => setSelectedVoice(item.value)}
          itemTextStyle={{ color: colorScheme === 'light' ? 'black' : 'black' }}
        />
      </View>
      <View style={{alignSelf: 'center', width: 150}}>
      <TouchableOpacity style={styles.button} onPress={handleOkButtonPress}>
        <Text style={styles.buttonText}>Ok</Text>
      </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};


export default Start;
