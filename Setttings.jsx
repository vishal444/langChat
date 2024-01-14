import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import {useNavigation} from '@react-navigation/native'; // Import useNavigation
import {useRoute} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Appearance, Alert} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Linking} from 'react-native';
import Background from './Background';

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
const Settings = () => {
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState(null);
  const [selectedComfLanguage, setSelectedComfLanguage] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null); // Initialize with a default value
  const [selectedVoice, setSelectedVoice] = useState(null);

  const route = useRoute(); // Get the route object
  const email = route.params?.email;

  const navigation = useNavigation();

  const handleOkButtonPress = async () => {
    if (
      selectedComfLanguage === null &&
      selectedTargetLanguage === null &&
      selectedLevel === null &&
      selectedVoice === null
    ) {
      // Display an alert if all values are null
      Alert.alert('Please select at least one setting before saving.');
      return;
    }
    const formData = new FormData();
    if (selectedComfLanguage !== null){
      formData.append('comfLang', selectedComfLanguage);
    }
    if (selectedTargetLanguage !== null) {
      formData.append('targetLang', selectedTargetLanguage);
    }
    if(selectedLevel !== null){
      formData.append('level', selectedLevel);
    }
    if( selectedVoice !== null) {
      formData.append('voice', selectedVoice);
    }
    formData.append('email', email);
    
    // Assuming this code is inside an async function or a component's lifecycle method
    try {
      const response = await fetch('http://127.0.0.1:5001/userData', {
        method: 'PUT',
        body: formData,
      });

      if (response.status === 200) {
        if (selectedComfLanguage !== null) {
          await AsyncStorage.setItem('COMFLANGUAGE', `${selectedComfLanguage}`);
        }
        if (selectedTargetLanguage !== null) {
          await AsyncStorage.setItem(
            'TARGETLANGUAGE',
            `${selectedTargetLanguage}`,
          );
        }
        if (selectedTargetLanguage !== null) {
          await AsyncStorage.setItem('LEVEL', `${selectedLevel}`);
        }
        if (selectedVoice !== null) {
          await AsyncStorage.setItem('VOICE', `${selectedVoice}`);
        }
        Alert.alert('Data saved successfully');
      } else {
        // Handle login error, if any
        Alert.alert('Settings update failed');
      }
    } catch (error) {
      // Handle network errors or other exceptions
      console.error('Request failed:', error.message);
    }
    setSelectedComfLanguage(null);
    setSelectedTargetLanguage(null);
    setSelectedLevel(null);
    setSelectedVoice(null);
  };

  const colorScheme = Appearance.getColorScheme();
  const styles = StyleSheet.create({
    backgroundStyle: {
      backgroundColor: colorScheme === 'light' ? 'white' : 'black',
      height: '100%',
    },
    button: {
      backgroundColor: colorScheme === 'light' ? '#3359DC' : '#3359DC',
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
      color: colorScheme === 'light' ? 'black' : 'black',
      fontSize: 18,
      marginTop: 20,
      fontWeight: 'bold',
    },
    container: {
      paddingHorizontal: 20,
      // paddingVertical: 2,
      borderRadius: 10, // Add borderRadius for the container
      backgroundColor: colorScheme === 'light' ? '#A6B4F2' : '#A6B4F2',
      // marginVertical: 5,
      marginBottom: 5,
    },
  });

  const privacyPolicyUrl =
    'https://vishal444.github.io/business_pages/privacy_policy.html';

  const handlePrivacyPolicyLinkPress = () => {
    Linking.openURL(privacyPolicyUrl).catch(err =>
      console.error('Error opening URL:', err),
    );
  };

  const termsAndConditions =
    'https://vishal444.github.io/business_pages/terms_of_service.html';
  const handleTermsAndConditionsLinkPress = () => {
    Linking.openURL(termsAndConditions).catch(err =>
      console.error('Error opening Terms and Conditions URL:', err),
    );
  };

  return (
    <SafeAreaView style={styles.backgroundStyle}>
      <ScrollView>
        <View>
          <Background/>
        <View style={{paddingHorizontal:5,paddingBottom:5, paddingTop: 10}}>
        <View style={styles.container}>
          <Text style={[styles.displayText, {paddingVertical: 20}]}>
            Change your comfortable language
          </Text>
          <Dropdown
            data={comfortableLang}
            search
            searchPlaceholder="Search"
            labelField="label"
            valueField="value"
            placeholder="Select language"
            value={selectedComfLanguage}
            onChange={item => setSelectedComfLanguage(item.value)}
            itemTextStyle={{color: colorScheme === 'light' ? 'black' : 'black'}}
          />
        </View>
        </View>
        <View style={{paddingHorizontal:5, paddingBottom:5}}>
        <View style={styles.container}>
          <Text style={[styles.displayText, {paddingVertical: 20}]}>
            Change the language you want to learn
          </Text>
          <Dropdown
            data={targetLang}
            search
            searchPlaceholder="Search"
            labelField="label"
            valueField="value"
            placeholder="Select language"
            value={selectedTargetLanguage}
            onChange={item => setSelectedTargetLanguage(item.value)}
            itemTextStyle={{color: colorScheme === 'light' ? 'black' : 'black'}}
          />
        </View>
        </View>
        <View style={{paddingHorizontal:5, paddingBottom:5}}>
        <View style={styles.container}>
          <Text style={[styles.displayText, {paddingVertical: 20}]}>
            Change your current proficiency level
          </Text>
          <Dropdown
            data={level}
            search
            searchPlaceholder="Search"
            labelField="label"
            valueField="value"
            placeholder="Select proficiency level"
            value={selectedLevel}
            onChange={item => setSelectedLevel(item.value)}
            itemTextStyle={{color: colorScheme === 'light' ? 'black' : 'black'}}
          />
        </View>
        </View>
        <View style={{paddingHorizontal:5}}>
        <View style={styles.container}>
          <Text style={styles.displayText}>
            Change your preferred voice
          </Text>
          <Dropdown
            data={voice}
            search
            searchPlaceholder="Search"
            labelField="label"
            valueField="value"
            placeholder="Select voice"
            value={selectedVoice}
            onChange={item => setSelectedVoice(item.value)}
            itemTextStyle={{color: colorScheme === 'light' ? 'black' : 'black'}}
          />
        </View>
        </View>
        <View style={{alignSelf: 'center', width: 150}}>
          <TouchableOpacity style={styles.button} onPress={handleOkButtonPress}>
            <Text style={styles.buttonText}>Ok</Text>
          </TouchableOpacity>
        </View>
        <View>
          <Text style={{fontSize:10, paddingTop:20}}>
            Your account is subject to the app's{' '}
            <Text
              style={{color: 'blue'}}
              onPress={handleTermsAndConditionsLinkPress}>
              Terms and Conditions
            </Text>
            {' and '}
            <Text
              style={{color: 'blue'}}
              onPress={handlePrivacyPolicyLinkPress}>
              Privacy Policy
            </Text>
          </Text>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;
