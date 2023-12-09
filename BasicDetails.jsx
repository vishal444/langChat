import React, {useState, useEffect} from 'react';
import {TouchableOpacity, Platform, StyleSheet, Text, View, Alert} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import Sound from 'react-native-sound';
import {useNavigation} from '@react-navigation/native'; // Import useNavigation
import {useRoute} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { Appearance } from 'react-native';

const audioRecorderPlayer = new AudioRecorderPlayer();

const BasicDetails = () => {
  const [recordSecs, setRecordSecs] = useState(0);
  const [recordTime, setRecordTime] = useState('00:00:00');
  const [isRecording, setIsRecording] = useState(false);
  const [sendAudio, setSendAudio] = useState(false);
  const navigation = useNavigation();
  const [comfortableLang, setComfortableLang] = useState('');
  const [userData, setUserData] = useState(null);
  const [fetchDataCompleted, setFetchDataCompleted] = useState(false);
  const [sound, setSound] = useState(null);
  const [status, setStatus] = useState('');
  const [question, setQuestion] = useState('');
  const [savedUri, setSavedUri] = useState(null);
  const route = useRoute();
  const email = route.params?.email;
  useEffect(() => {
    const fetchData = async () => {
        const comfValue = await AsyncStorage.getItem('COMFLANGUAGE');
        const tarValue = await AsyncStorage.getItem('TARGETLANGUAGE');
        const level = await AsyncStorage.getItem('LEVEL');
        setComfortableLang(comfValue);
        setTargetLanguage(tarValue);
        setLevel(level);
    };
    fetchData();
  });
  useEffect(() => {
    const fetchData = async () => {
      console.log('email', email);
      try {
        const response = await fetch(
          `http://127.0.0.1:5001/userData?param=${email}`,
          {
            method: 'GET',
          },
        );
        const data = await response.json();
        setUserData(data);
        setComfortableLang(data[2]);
        sendGenerateAudioRequest();
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [email]);

  const sendGenerateAudioRequest = async () => {
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('question', question);
      formData.append('comfLang', comfortableLang);
      if (Platform.OS === 'ios') {
        formData.append('platform', 'IOS');
        if (savedUri) {
          formData.append('comfResult', {
            uri: `file://${savedUri}`,
            type: 'audio/m4a',
            name: 'recording.m4a',
          });
        }

      } else if (Platform.OS === 'android') {
        formData.append('platform', 'ANDROID');
        if (savedUri) {
          formData.append('comfResult', {
            uri: `file://${savedUri}`,
            type: 'audio/mp4',
            name: 'recording.mp4',
          });
        }
      }
     
      const response = await fetch(`http://127.0.0.1:5001/basic_details`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          // Add any other headers if needed
        },
      });

      const data = await response.json();
      if(data.llm_status === 'failed'){
        Alert.alert('Due to high demand we are facing some issue, please try again with a new recording');
        return;
      }
      setStatus(data.status);
      setQuestion(data.question);
      if (data.audio != null) {
        const audioFilePath = await saveAudioToLocalFile(data.audio);
        if (audioFilePath) {
          playAudio(audioFilePath);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    // Check if data.status is "finished"
    if (status === 'finished') {
      navigation.navigate('Home', {
        email,
      });
    }
  }, [status]);
  const startRecording = async () => {
    try {
      if (audioRecorderPlayer.isRecording) {
        await audioRecorderPlayer.stopRecorder();
      }
      const path = Platform.select({
        ios: 'basicRecording.m4a',
        android: `${RNFS.CachesDirectoryPath}/basicRecording.mp4`,
      });
      const result = await audioRecorderPlayer.startRecorder(path);
      audioRecorderPlayer.addRecordBackListener(e => {
        setRecordSecs(e.currentPosition);
        setRecordTime(
          audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
        );
      });
      setIsRecording(true);
      setSavedUri(result);
      console.log('Path:', result);
    } catch (error) {
      console.log(error);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecordSecs(0);
      setIsRecording(false);
      setSendAudio(true);
      console.log('result', savedUri);
    } catch (error) {
      console.log(error);
    }
  };

  if (sendAudio) {
    console.log(savedUri);
    sendGenerateAudioRequest();
    setSendAudio(false);
  }
  const saveAudioToLocalFile = async base64Data => {
    // const timestamp = Date.now();
    const audioFilePath = `${RNFS.CachesDirectoryPath}/questionnaireAudio.wav`;

    try {
      await RNFS.writeFile(audioFilePath, base64Data, 'base64');
      console.log('Audio saved to:', audioFilePath);
      return audioFilePath;
    } catch (error) {
      console.error('Error saving audio to local file:', error);
      return null;
    }
  };

  const playAudio = async (filePath, callback) => {
    console.log('Attempting to play sound:', filePath);

    if (sound) {
      sound.release();
    }

    const newSound = new Sound(filePath, '', async error => {
      if (error) {
        console.error('Error loading sound:', error);
      } else {
        console.log('Sound loaded successfully');

        newSound.play(async success => {
          if (!success) {
            console.error('Error playing sound');
          } else {
            console.log('Sound played successfully');

            if (callback && typeof callback === 'function') {
              callback(); // Execute the callback function
            }
          }
          newSound.release();
        });
      }
    });
    setSound(newSound);
  };
  const colorScheme = Appearance.getColorScheme();
  const styles = StyleSheet.create({
    backgroundStyle: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colorScheme === 'light' ? 'white' : 'black',
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
      <View>
        <TouchableOpacity
          id="comfButton"
          style={styles.button}
          onPress={() => {
            isRecording ? stopRecording() : startRecording();
          }}>
          <Text style={styles.buttonText}>
            {isRecording
              ? `Stop Recording (${comfortableLang})`
              : `Start Recording (${comfortableLang})`}
          </Text>
        </TouchableOpacity>
        <Text style={styles.displayText}>Question: {question}</Text>
      </View>
    </SafeAreaView>
  );
};


export default BasicDetails;
