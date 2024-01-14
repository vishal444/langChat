import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  ImageBackground,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import {Appearance} from 'react-native';
import {SafeAreaView, StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ScrollView} from 'react-native-gesture-handler';
import {Dimensions} from 'react-native';
import Progress from './Progress';

const audioRecorderPlayer = new AudioRecorderPlayer();

const Course = () => {
  const [savedUri, setSavedUri] = useState(null);
  const [sendAudio, setSendAudio] = useState(false);
  const [comfortableLang, setComfortableLang] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [langlevel, setLevel] = useState('');
  const [voiceInterface, setVoiceInterface] = useState('');
  const [emailValue, setEmail] = useState('');
  const [sound, setSound] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [endOfcourse, setEndOfCourse] = useState(false);
  const [isStart, setIsStart] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loadingDots, setLoadingDots] = useState(1); // Track the number of dots
  const [chapterTopics, setChapterTopics] = useState([]);
  const [progressResponse, setProgressResponse] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [noCourseAvailable, setNoCourseAvailable] = useState(false);
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
      const voice = await AsyncStorage.getItem('VOICE');
      setComfortableLang(comfValue);
      setTargetLanguage(tarValue);
      setLevel(level);
      setEmail(emailHolder);
      setVoiceInterface(voice);
      setDataLoaded(true);
    };
    fetchDataCourse();
  });

  useEffect(() => {
    if (!targetLanguage || !dataLoaded) return; // Only proceed if targetLanguage is not null and data is loaded

    const getCourseDetails = async () => {
      const formData = new FormData();
      formData.append('tarLang', targetLanguage);
      formData.append('email', emailOld);
      try {
        const response = await fetch(`http://127.0.0.1:5001/getCourseDetails`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        setChapterTopics(data);
      } catch (error) {
        console.error(error);
        setNoCourseAvailable(true);
      }
    };

    getCourseDetails();
  }, [targetLanguage, dataLoaded]);

  useEffect(() => {
    let interval;

    if (isLoading) {
      // Start the interval when loading is true
      interval = setInterval(() => {
        setLoadingDots(prevDots => (prevDots % 3) + 1); // Cycle through 1, 2, 3
      }, 1000);
    } else {
      // Clear the interval when loading is false
      clearInterval(interval);
    }

    return () => clearInterval(interval); // Cleanup the interval on component unmount
  }, [isLoading]);

  const loadingText = `Preparing${'.'.repeat(loadingDots)}`; // Create loading text with dots
  const sendGenerateAudioRequest = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('tarLang', targetLanguage);
    formData.append('comfLang', comfortableLang);
    formData.append('email', emailValue);
    formData.append('level', langlevel);
    formData.append('voice', voiceInterface);
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
      const data = await audioResponse.json();
      if (data.llm_status === 'failed') {
        setIsLoading(false);
        Alert.alert(
          'Due to high demand we are facing some issue, please try again with a new recording',
        );
        return;
      }

      setResponseText(data.content);
      setProgressResponse(data.progress);
      if (data.endOfCourse === 'yes') {
        setEndOfCourse(true);
      }
      if (data.start === 'no') {
        setIsStart(false);
        setShowNext(true);
      }
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
    setIsRecording(false);
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
      sendGenerateAudioRequest();
    } catch (error) {
      console.log(error);
    }
  };

  if (sendAudio) {
    sendGenerateAudioRequest();
    setSendAudio(false);
  }

  const saveAudioToLocalFile = async base64Data => {
    const audioFilePath = `${RNFS.CachesDirectoryPath}/courseAudio.wav`;

    try {
      await RNFS.writeFile(audioFilePath, base64Data, 'base64');
      return audioFilePath;
    } catch (error) {
      console.error('Error saving audio to local file:', error);
      return null;
    }
  };

  const playAudio = async filePath => {
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
  const screenWidth = Dimensions.get('window').width;
  const styles = StyleSheet.create({
    backgroundStyle: {
      backgroundColor: colorScheme === 'light' ? '#D3D3D0' : '#E7CE9E',
    },
    button: {
      backgroundColor: colorScheme === 'light' ? '#3359DC' : '#3359DC',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
    },
    buttonLeft: {
      backgroundColor: colorScheme === 'light' ? '#3359DC' : '#3359DC',
      paddingHorizontal: 20,
      paddingVertical: 10,
      alignSelf: 'flex-start',
      borderRadius: 5,
    },
    buttonRight: {
      backgroundColor: colorScheme === 'light' ? '#3359DC' : '#3359DC',
      // paddingHorizontal: 20,
      paddingVertical: 10,
      alignSelf: 'flex-end',
      borderRadius: 5,
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
      borderRadius: 10,
      backgroundColor: colorScheme === 'light' ? 'lightgrey' : 'lightgrey',
      alignSelf: 'center'
    },
    loadingText: {
      fontSize: 20,
      fontWeight: 'bold',
      paddingHorizontal: 15
    },
    textSection: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      minWidth: 275,
      maxWidth: '80%',
      borderWidth: 1, // Add a border
      borderColor: colorScheme === 'light' ? '#7F86F2' : 'white', // Set the border color
      borderRadius: 10, // Add this line for rounded edges
      color: colorScheme === 'light' ? 'black' : 'black',
      alignSelf: 'flex-end',
      backgroundColor: colorScheme === 'light' ? '#7F86F2' : 'white',
      marginBottom: 5,
      fontSize: 20,
      alignItems: 'center',
    },
    textDisplay: {
      color: colorScheme === 'light' ? 'white' : 'black',
      paddingLeft: 35,
    },
    image: {
      flex: 1,
      // justifyContent: 'center',
      width: screenWidth,
    },
  });

  return (
    <SafeAreaView style={styles.backgroundStyle}>
      {/* <Background/> */}

      <View style={{height: '100%'}}>
        <View style={{alignSelf: 'center', paddingTop:5}}>
          {isStart === true && ( // only show start button at the start
            <TouchableOpacity style={styles.button} onPress={goToNext}>
              <Text style={styles.buttonText}>Start the course</Text>
            </TouchableOpacity>
          )}
        </View>
        {isLoading && (
          // Show loading text or spinner while waiting for the response
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        )}

        <ScrollView>
          <Progress
            chapters={chapterTopics}
            response={responseText}
            progressResp={progressResponse}
            targetLanguage={targetLanguage}
            comfortableLang={comfortableLang}
            // voice={voiceInterface}
          />
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            paddingBottom: 64,
            justifyContent: 'space-around',
            backgroundColor: 'transparent',
          }}>
          {showNext && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                isRecording ? stopRecording() : startRecording();
              }}>
              <Text style={styles.buttonText}>
                {isRecording
                  ? `Stop Recording ${comfortableLang}`
                  : `Ask a doubt ${comfortableLang}`}
              </Text>
            </TouchableOpacity>
          )}
          {showNext && ( // Conditionally render Next button
            <TouchableOpacity style={styles.button} onPress={goToNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Course;
