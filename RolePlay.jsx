import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {Appearance} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import Background from './Background';
import {TextInput} from 'react-native-gesture-handler';
import {ScrollView} from 'react-native-gesture-handler';
import {useRoute} from '@react-navigation/native';

function RolePlay() {
  const navigation = useNavigation();
  const [textInputValue, setTextInputValue] = useState(''); // State to store the text input value
  const [emailValue, setEmail] = useState('');
  const [comfortableLang, setComfortableLang] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [langlevel, setLevel] = useState('');
  const [hasRoles, setHasRoles] = useState(false);
  const [roles, setRoles] = useState([]);
  const route = useRoute();
  const email = route.params?.email;

  useEffect(() => {
    const fetchDataCourse = async () => {
      const comfValue = await AsyncStorage.getItem('COMFLANGUAGE');
      const tarValue = await AsyncStorage.getItem('TARGETLANGUAGE');
      const level = await AsyncStorage.getItem('LEVEL');
      const emailHolder = await AsyncStorage.getItem('may');
      setComfortableLang(comfValue);
      setTargetLanguage(tarValue);
      setLevel(level);
      setEmail(emailHolder);
    };
    fetchDataCourse();
  });
  useEffect(() => {
    fetchRoles();
  }, []);

  // Function to fetch roles
  const fetchRoles = async () => {
    const formData = new FormData();
    formData.append('email', await AsyncStorage.getItem('may'));
    try {
      const rolesResponse = await fetch(`http://127.0.0.1:5001/getRoles`, {
        method: 'POST',
        body: formData,
      });
      const rolesData = await rolesResponse.json(); // Parse the JSON response
      console.log('Fetched roles data:', rolesData.roles);
      setRoles(rolesData.roles);
      setHasRoles(rolesData.roles.length > 0);
      setTextInputValue('');
    } catch (error) {
      console.error(error);
    }
  };

  // Function to handle button press
  const handlePress = rolePlayScenario => {
    // Navigate to RolePlayConversation and pass the rolePlayType
    navigation.navigate('RolePlayConvesation', {rolePlayScenario, email});
  };
  const addRoles = async role => {
    const formData = new FormData();
    formData.append('role', role);
    formData.append('email', emailValue);
    try {
      const rolesResponse = await fetch(`http://127.0.0.1:5001/addRole`, {
        method: 'POST',
        body: formData,
      });
      await fetchRoles(); // Call fetchRoles to update the list
      setHasRoles(true);
      setTextInputValue('');
    } catch (error) {
      console.error(error);
    }
  };
  const colorScheme = Appearance.getColorScheme();
  const styles = StyleSheet.create({
    backgroundStyle: {
      backgroundColor: colorScheme === 'light' ? 'white' : 'black',
    },
    button: {
      backgroundColor: colorScheme === 'light' ? '#3359DC' : '#3359DC',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 25,
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
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    textSection: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      minWidth: 275,
      maxWidth: '80%',
      borderWidth: 1, // Add a border
      borderColor: colorScheme === 'light' ? 'lightgray' : 'white', // Set the border color
      borderRadius: 10, // Add this line for rounded edges
      color: colorScheme === 'light' ? 'black' : 'black',
      alignSelf: 'flex-end',
      backgroundColor: colorScheme === 'light' ? 'lightgray' : 'white',
      marginBottom: 5,
      fontSize: 20,
      alignItems: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.backgroundStyle}>
      <Background />
      <View style={{alignSelf: 'center', width: 275, height: '100%'}}>
        {/* Map over the roles to create buttons */}
        {roles &&
          roles.map((role, index) => (
            <TouchableOpacity
              key={index}
              style={styles.button}
              onPress={() => handlePress(role)}>
              <Text style={styles.buttonText}>{role} →</Text>
            </TouchableOpacity>
          ))}
        <View
          style={{
            justifyContent: 'center',
            paddingVertical: 15,
            alignItems: 'center',
          }}>
          <View
            style={{
              backgroundColor: '#5A75CC',
              borderRadius: 10,
              padding: 5,
            }}>
            {hasRoles ? (
              <Text
                style={{
                  fontWeight: 'bold',
                  color: 'white',
                }}>
                Add more characters below like Librarian, Accountant etc. :
              </Text>
            ) : (
              <Text
                style={{
                  fontWeight: 'bold',
                  color: 'white',
                }}>
                Give your own character you want to talk with like Restaurant
                waiter, Shopping assistant, Bartender etc:
              </Text>
            )}
          </View>
          <View
            style={{
              flexDirection: 'row', // Align items horizontally
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: 15,
            }}>
            <TextInput
              style={{
                height: 60,
                borderColor: '#A6B4F2',
                borderWidth: 1,
                width: 180,
                backgroundColor: '#A6B4F2',
                borderRadius: 10,
                marginRight: 10, // Add some space between TextInput and Button
                color: 'white',
              }}
              onChangeText={text => setTextInputValue(text)} // Update state on text change
              value={textInputValue} // Set TextInput value from state
              placeholder="Enter text here" 
            ></TextInput>
            <TouchableOpacity style={styles.button}>
              <Text
                style={styles.buttonText}
                onPress={() => addRoles(textInputValue)}>
                Add
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default RolePlay;
