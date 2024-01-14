import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Appearance} from 'react-native';
import RNFS from 'react-native-fs';
import Background, {homeStyle} from './Background';
import Imagepath from './assets/Imagepath';
import {ScrollView} from 'react-native-gesture-handler';

const audioRecorderPlayer = new AudioRecorderPlayer();

const RolePlayConvesation = () => {
  const [scenario, setScenario] = useState('');
  const [comfortableLang, setComfortableLang] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [langlevel, setLevel] = useState('');
  const [emailValue, setEmail] = useState('');
  const [savedUri, setSavedUri] = useState(null);
  const [sound, setSound] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDots, setLoadingDots] = useState(1); // Track the number of dots
  const [isRecording, setIsRecording] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [recordSecs, setRecordSecs] = useState(0);
  const [recordTime, setRecordTime] = useState('00:00:00');
  const [rolePlayResult, setRolePlayResult] = useState('');
  const [hasVoiceInput, setHasVoiceInput] = useState(false);
  const [voiceInterface, setVoiceInterface] = useState('');
  const route = useRoute(); // Get the route object
  const email = route.params?.email;
  const role = route.params?.rolePlayScenario;

  useEffect(() => {
    if (role) {
      setScenario(role);
    }
  }, [route.params]);

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
      setVoiceInterface(voice);
      setEmail(emailHolder);
    };
    fetchDataCourse();
  });
  useEffect(() => {
    const fetchChat = async () => {
      try {
        const rolePlayResponse = await fetch(
          `http://127.0.0.1:5001/rolePlayData?param=${email}&role=${role}`,
          {
            method: 'GET',
          },
        );
        const textData = await rolePlayResponse.json();
        setRolePlayResult(textData);
      } catch (error) {
        console.error('Error fetching chat data:', error);
      }
    };
    fetchChat();
  }, [role]);
  useEffect(() => {
    const fetchFirst = async () => {
      const formData = new FormData();
      formData.append('first', 'yes');
      formData.append('role', role);
      formData.append('email', await AsyncStorage.getItem('may'));
      formData.append('voice', await AsyncStorage.getItem('VOICE'));
      try {
        const audioResponse = await fetch(`http://127.0.0.1:5001/rolePlay`, {
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
    };
    fetchFirst();
  }, []);
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
  const loadingText = `Thinking${'.'.repeat(loadingDots)}`; // Create loading text with dots

  const startRecording = async () => {
    setHasVoiceInput(true);
    try {
      if (audioRecorderPlayer.isRecording) {
        await audioRecorderPlayer.stopRecorder();
      }
      const path = Platform.select({
        ios: 'roleRecording.m4a',
        android: `${RNFS.CachesDirectoryPath}/roleRecording.mp4`,
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
      setHasVoiceInput(true);
    } catch (error) {
      console.log(error);
    }
  };
  const handlePress = async () => {
    await stopRecording();
    if (hasVoiceInput) {
      sendGenerateAudioRequest();
    } else {
      Alert.alert('There is no input data');
    }
  };
  const sendGenerateAudioRequest = async () => {
    setIsLoading(true);
    setHasVoiceInput(false);
    const formData = new FormData();
    formData.append('tarLang', targetLanguage);
    formData.append('comfLang', comfortableLang);
    formData.append('email', emailValue);
    formData.append('level', langlevel);
    formData.append('role', role);
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
      const audioResponse = await fetch(`http://127.0.0.1:5001/rolePlay`, {
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
    try {
    const rolePlayResponse = await fetch(
      `http://127.0.0.1:5001/rolePlayData?param=${email}&role=${role}`,
      {
        method: 'GET',
      },
    );
    const textData = await rolePlayResponse.json();
    setRolePlayResult(textData);
    } catch (error) {
      console.error('Error fetching chat data:', error);
    }
    setIsLoading(false);
    setIsRecording(false);
    setSavedUri(null);
  };
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
  const colorScheme = Appearance.getColorScheme();
  let imageSource;
  if (colorScheme === 'light') {
    imageSource = Imagepath.icArrowDark;
  } else if (colorScheme === 'dark') {
    imageSource = Imagepath.icArrowDark;
  }
  const styles = StyleSheet.create({
    backgroundStyle: {
      backgroundColor: colorScheme === 'light' ? 'white' : 'black',
    },
    button: {
      backgroundColor: colorScheme === 'light' ? '#3359DC' : '#3359DC',
      paddingHorizontal: 10,
      paddingVertical: 5,
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
    chatSectionCon: {
      paddingHorizontal: 10,
      paddingVertical: 10,
      maxWidth: '80%',
      borderWidth: 1, // Add a border
      borderColor: colorScheme === 'light' ? 'lightgray' : 'white', // Set the border color
      borderRadius: 10, // Add this line for rounded edges
      alignSelf: 'flex-start',
      backgroundColor: colorScheme === 'light' ? '#7F86F2' : 'white',
      color: colorScheme === 'light' ? 'white' : 'black',
      marginBottom: 5,
    },
    chatSectionResp: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      maxWidth: '80%',
      borderWidth: 1, // Add a border
      borderColor: colorScheme === 'light' ? 'lightgray' : 'white', // Set the border color
      borderRadius: 10, // Add this line for rounded edges
      color: colorScheme === 'light' ? 'white' : 'black',
      alignSelf: 'flex-end',
      backgroundColor: colorScheme === 'light' ? '#7F86F2' : 'white',
      marginBottom: 5,
    },
    responseButton: {
      backgroundColor: colorScheme === 'light' ? 'white' : 'white', // Set the background color to black
      justifyContent: 'center',
      alignItems: 'center',
      width: 50,
      height: 50,
      borderRadius: 50,
      marginTop: 10,
    },
    chatView: {
      paddingVertical: 10,
      borderRadius: 10,
      paddingBottom: 100,
    },
    concatenatedChat: {
      color: colorScheme === 'light' ? 'white' : 'black',
    },
    chatResponse: {
      color: colorScheme === 'light' ? 'white' : 'black',
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
  });
  return (
    <SafeAreaView style={styles.backgroundStyle}>
      <Background />
      <View style={{paddingHorizontal: 5, paddingTop:5}}>
        <View style={{height: '100%'}}>
          {/* Render your UI elements here */}
          <View style={homeStyle.topRectangle}>
          <Text style={{alignSelf: 'center',fontWeight:'bold', color:'white',fontSize:20}}>{role}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                isRecording ? stopRecording() : startRecording();
              }}>
              <Text style={styles.buttonText}>
                {isRecording
                  ? `Stop Recording ${targetLanguage}`
                  : `Speak in ${targetLanguage}`}
              </Text>
            </TouchableOpacity>
            <View style={{alignSelf: 'center', width: 60}}>
              <TouchableOpacity
                id="respButton"
                style={styles.responseButton}
                onPress={handlePress}
              >
                <Image source={imageSource} style={{width: 50, height: 50}} />
              </TouchableOpacity>
            </View>
          </View>
          {isLoading && (
            // Show loading text or spinner while waiting for the response
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{loadingText}</Text>
            </View>
          )}
          <View style={styles.chatView}>
            <ScrollView>
              <View>
                {rolePlayResult &&
                  rolePlayResult.rolePlayData.map((item, index) => (
                    <View key={index}>
                      <View style={styles.chatSectionCon}>
                        <Text style={styles.concatenatedChat}>
                          User: {item.user}
                        </Text>
                      </View>
                      <View style={styles.chatSectionResp}>
                        <Text style={styles.chatResponse}>
                          Response: {item.response}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RolePlayConvesation;
