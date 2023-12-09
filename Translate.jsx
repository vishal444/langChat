import React, {useState} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Dropdown} from 'react-native-element-dropdown';
import { Appearance } from 'react-native';

const comfLang = [
  {label: 'English', value: 'English'},
  {label: 'German', value: 'German'},
  {label: 'French', value: 'French'},
  {label: 'Spanish', value: 'Spanish'},
  {label: 'Dutch', value: 'Dutch'},
];
const currentLang = [
  {label: 'English', value: 'English'},
  {label: 'German', value: 'German'},
  {label: 'French', value: 'French'},
  {label: 'Spanish', value: 'Spanish'},
  {label: 'Dutch', value: 'Dutch'},
];
const Translate = () => {
  const [text, setText] = useState('');
  const [selectedCurrentLang, setSelectedCurrentLang] = useState(null);
  const [selectedComfLang, setSelectedComfLang] = useState(null);
  const [data, setData] = useState('');

  const translate = async () => {
    const formData = new FormData();
    formData.append('currentLang', selectedCurrentLang);
    formData.append('comfortableLang', selectedComfLang);
    formData.append('text', text);
    try {
      const response = await fetch(`http://127.0.0.1:5001/translate`, {
        method: 'POST',
        body: formData,
      });
      const resp = await response.json();
      setData(resp);
    } catch (error) {
      console.error(error);
    }
  };

  const colorScheme = Appearance.getColorScheme();
  const styles = StyleSheet.create({
    backgroundStyle: {
      backgroundColor: colorScheme === 'light' ? 'white' : 'black',
      height: '100%',
    },
    button: {
      backgroundColor: colorScheme === 'light' ? 'black' : 'white', // Set the background color to black
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
      marginTop: 20,
      width:150,
      alignSelf: 'center', 
    },
    buttonText: {
      color: colorScheme === 'light' ? 'white' : 'black', // Set text color to white
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    displayText: {
      color: colorScheme === 'light' ? 'black' : 'white',
      fontSize: 18,
      marginTop: 20,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });
  
  return (
    <SafeAreaView style={styles.backgroundStyle}>
      <View
        style={{
          alignItems: 'center',
          padding: 10,
          paddingVertical: 20,
          width: '100%',
        }}>
        <TextInput
          style={{
            height: 100,
            borderColor: 'lightgray',
            borderWidth: 1,
            width: '100%',
            backgroundColor: 'lightgray',
            borderRadius: 10,
          }}
          onChangeText={text => setText(text)}
          placeholder='Enter your text'
          value={text}
        />
      </View>
      <View>
        <Dropdown
          data={currentLang}
          search
          searchPlaceholder="Search"
          labelField="label"
          valueField="value"
          placeholder="Select language of text"
          value={selectedCurrentLang}
          onChange={item => setSelectedCurrentLang(item.value)}
        />

        <Dropdown
          data={comfLang}
          search
          searchPlaceholder="Search"
          labelField="label"
          valueField="value"
          placeholder="Select language to translate into"
          value={selectedComfLang}
          onChange={item => setSelectedComfLang(item.value)}
        />
      </View>
      <View>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText} onPress={translate}>
            Translate
          </Text>
        </TouchableOpacity>
      </View>
      {data.translatedContent && ( // Conditionally render Next button
      <View
        style={{
          alignItems: 'center',
          padding: 10,
          paddingVertical: 20,
          width: '100%',
        }}>
        <Text
          style={{
            height: 100,
            borderColor: 'lightgray',
            borderWidth: 1,
            width: '100%',
            backgroundColor: 'lightgray',
            borderRadius: 20,
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: 18,
            marginTop: 20,
          }}>
          {data.translatedContent}
        </Text>
      </View>
       )}
    </SafeAreaView>
  );
};
export default Translate;
