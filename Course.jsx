import React, {useState, useEffect} from 'react';
import {Text, View, TouchableOpacity, Alert} from 'react-native';
import {useRoute} from '@react-navigation/native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import {Appearance} from 'react-native';
import {SafeAreaView, StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView } from 'react-native-gesture-handler';

const audioRecorderPlayer = new AudioRecorderPlayer();

const Course = () => {
  const [savedUri, setSavedUri] = useState(null);
  const [sendAudio, setSendAudio] = useState(false);
  const [comfortableLang, setComfortableLang] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [langlevel, setLevel] = useState('');
  const [emailValue, setEmail] = useState('');
  const [sound, setSound] = useState(null);
  const [courseHistory, setCourseHistory] = useState('');
  const [responseText, setResponseText] = useState('');
  const [endOfcourse, setEndOfCourse] = useState(false);
  const [isStart, setIsStart] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const route = useRoute();
  const emailOld = route.params?.email;
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [recordTime, setRecordTime] = useState('00:00:00');
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

  const sendGenerateAudioRequest = async () => {
    setIsLoading(true);
    console.log('emailOld:', emailOld);
    const formData = new FormData();
    formData.append('tarLang', targetLanguage);
    formData.append('comfLang', comfortableLang);
    formData.append('email', emailValue);
    formData.append('level', langlevel);
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
    try {
      const audioResponse = await fetch(`http://127.0.0.1:5001/teach_course`, {
        method: 'POST',
        body: formData,
      });
      
      if (audioResponse.llm_status === 'failed') {
        Alert.alert(
          'Due to high demand we are facing some issue, please try again with a new recording',
        );
        return;
      }
      const data = await audioResponse.json();
      setResponseText(data.content);
      if (data.endOfCourse === 'yes') {
        setEndOfCourse(true);
      }
      if (data.start === 'no') {
        setIsStart(false);
        setShowNext(true);
      }
      console.log(' end of course:', data.endOfCourse);
      const audioData = data.audio;
      if (data.audio != null) {
        const audioFilePath = await saveAudioToLocalFile(audioData);

        if (audioFilePath) {
          playAudio(audioFilePath);
        }
      }
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
    setSavedUri(null);
  };

  const startRecording = async () => {
    try {
      if (audioRecorderPlayer.isRecording) {
        await audioRecorderPlayer.stopRecorder();
      }
      const path = Platform.select({
        ios: 'courseRecording.m4a',
        android: `${RNFS.CachesDirectoryPath}/courseRecording.mp4`,
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
    const audioFilePath = `${RNFS.CachesDirectoryPath}/courseAudio.wav`;

    try {
      await RNFS.writeFile(audioFilePath, base64Data, 'base64');
      console.log('Audio saved to:', audioFilePath);
      return audioFilePath;
    } catch (error) {
      console.error('Error saving audio to local file:', error);
      return null;
    }
  };

  const playAudio = async filePath => {
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
          }
          newSound.release();
        });
      }
    });

    setSound(newSound);
  };
  const goToNext = () => {
    sendGenerateAudioRequest();
  };

  const colorScheme = Appearance.getColorScheme();
  const styles = StyleSheet.create({
    backgroundStyle: {
      // flex: 1,
      // justifyContent: 'center',
      // alignItems: 'center',
      backgroundColor: colorScheme === 'light' ? 'white' : 'black',
    },
    button: {
      backgroundColor: colorScheme === 'light' ? 'black' : 'white',
      // paddingHorizontal: 20,
      // paddingVertical: 10,
      // borderRadius: 5,
      // marginTop: 20,
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
      color: colorScheme === 'light' ? 'white' : 'black',
      alignSelf: 'flex-end',
      backgroundColor: colorScheme === 'light' ? 'lightgray' : 'white',
      marginBottom: 5,
      fontSize:20,
      alignItems: 'center'
    },
  });

  return (
    <SafeAreaView style={styles.backgroundStyle}>
      <View style={{alignSelf: 'center', width: 275, height: '100%'}}>
        {isStart === true && ( // only show start button at the start
          <TouchableOpacity style={styles.button} onPress={goToNext}>
            <Text style={styles.buttonText}>Start the course</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            isRecording ? stopRecording() : startRecording();
          }}>
          <Text style={styles.buttonText}>
            {isRecording
              ? `Stop Recording ${comfortableLang}`
              : `Ask a question ${comfortableLang}`}
          </Text>
        </TouchableOpacity>

        {showNext && ( // Conditionally render Next button
          <TouchableOpacity style={styles.button} onPress={goToNext}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        )}
        {endOfcourse === true && ( // Conditionally render Next button
          <Text>Course finito !!</Text>
        )}
        {isLoading && (
          // Show loading text or spinner while waiting for the response
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
        {responseText && (
        <ScrollView style={{paddingVertical:10}}>
          <View style={styles.textSection}>
          <Text style={{paddingLeft:35}}>{responseText}</Text>
          </View>
        </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Course;
