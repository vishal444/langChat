import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, Platform, Image} from 'react-native';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {useRoute} from '@react-navigation/native';
import {Appearance} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  Alert,
} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';

const audioRecorderPlayer = new AudioRecorderPlayer();

const Chat = () => {
  const [recordSecs, setRecordSecs] = useState(0);
  const [recordTime, setRecordTime] = useState('00:00:00');
  const [sendRequestAudio, setSendRequestAudio] = useState(false);
  const [isComfRecording, setComfRecording] = useState(false);
  const [isTarRecording, setTarRecording] = useState(false);
  const [emailValue, setEmail] = useState('');
  const [sound, setSound] = useState(null);
  const [savedComfUri, setSavedComfUri] = useState(null);
  const [savedTarUri, setSavedTarUri] = useState(null);
  const [chatResult, setChatResult] = useState('');
  const [comfortableLang, setComfortableLang] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [langlevel, setLevel] = useState('');
  const [userData, setUserData] = useState(null);
  const [hasChatData, setHasChatData] = useState(false);
  const route = useRoute();
  const email = route.params?.email;

  useEffect(() => {
    const fetchData = async () => {
        const comfValue = await AsyncStorage.getItem('COMFLANGUAGE');
        const tarValue = await AsyncStorage.getItem('TARGETLANGUAGE');
        const level = await AsyncStorage.getItem('LEVEL');
        const emailHolder = await AsyncStorage.getItem('may');
        setComfortableLang(comfValue);
        setTargetLanguage(tarValue);
        setLevel(level);
        setEmail(emailHolder);
    };
    fetchData();
  });
  const startComfRecording = async () => {
    try {
      const path = Platform.select({
        ios: 'comfRecording.m4a',
        android: `${RNFS.CachesDirectoryPath}/comfRecording.mp4`,
      });
      const result = await audioRecorderPlayer.startRecorder(path);
      audioRecorderPlayer.addRecordBackListener(e => {
        setRecordSecs(e.currentPosition);
        setRecordTime(
          audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
        );
      });
      setComfRecording(true);
      setSavedComfUri(result);
      console.log('Path:', result);
    } catch (error) {
      console.log(error);
    }
  };
  const startTarRecording = async () => {
    try {
      const path = Platform.select({
        ios: 'tarRecording.m4a',
        android: `${RNFS.CachesDirectoryPath}/tarRecording.mp4`,
      });
      const result = await audioRecorderPlayer.startRecorder(path);
      audioRecorderPlayer.addRecordBackListener(e => {
        setRecordSecs(e.currentPosition);
        setRecordTime(
          audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
        );
      });
      setTarRecording(true);
      setSavedTarUri(result);
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
      setComfRecording(false);
      setTarRecording(false);
      setSendRequestAudio(true);
      setHasChatData(true);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAndPlayAudio = async () => {
    setIsLoading(true);
    setHasChatData(false);
    const formData = new FormData();
    formData.append('comfLang', comfortableLang);
    formData.append('targetLang', targetLanguage);
    formData.append('level', langlevel);
    formData.append('email', emailValue);

    if (Platform.OS === 'ios') {
      formData.append('platform', 'IOS');
      if (savedComfUri) {
        formData.append('comfResult', {
          uri: `file://${savedComfUri}`,
          type: 'audio/m4a',
          name: 'comfRecording.m4a',
        });
      }
      if (savedTarUri) {
        formData.append('tarResult', {
          uri: `file://${savedTarUri}`,
          type: 'audio/m4a',
          name: 'tarRecording.m4a',
        });
      }
    } else if (Platform.OS === 'android') {
      formData.append('platform', 'ANDROID');
      if (savedComfUri) {
        formData.append('comfResult', {
          uri: `file://${savedComfUri}`,
          type: 'audio/mp4',
          name: 'comfRecording.mp4',
        });
      }
      if (savedTarUri) {
        formData.append('tarResult', {
          uri: `file://${savedTarUri}`,
          type: 'audio/mp4',
          name: 'tarRecording.mp4',
        });
      }
    }

    try {
      const response = await fetch(`http://127.0.0.1:5001/chat`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.llm_status === 'failed') {
        Alert.alert(
          'Due to high demand we are facing some issue, please try again with a new recording',
        );
        return;
      }

      const audioData = data.audio1;
      const audioFilePath = await saveAudioToLocalFile(audioData, 1);
      console.log('Audio saved to:', audioFilePath);
      if (audioFilePath) {
        playAudio(audioFilePath);
      }
    } catch (error) {
      console.error(error);
    }
    const chatDataRec = await fetch(
      `http://127.0.0.1:5001/chatData?param=${email}`,
      {
        method: 'GET',
      },
    );
    const textData = await chatDataRec.json();
    setChatResult(textData);
    setIsLoading(false);
    setSavedComfUri(null);
    setSavedTarUri(null);
  };

  const saveAudioToLocalFile = async (base64Data, index) => {
    const audioFilePath = `${RNFS.CachesDirectoryPath}/tempAudio_${index}.wav`;

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
  const handlePress = () => {
    if (hasChatData) {
      fetchAndPlayAudio();
    } else {
      Alert.alert('There is no input data');
    }
  };
  const colorScheme = Appearance.getColorScheme();
  const styles = StyleSheet.create({
    backgroundStyle: {
      backgroundColor: colorScheme === 'light' ? 'white' : 'black',
    },
    button: {
      backgroundColor: colorScheme === 'light' ? 'black' : 'white', // Set the background color to black
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
      marginTop: 20,
    },
    comfButton: {
      backgroundColor: colorScheme === 'light' ? 'black' : 'white',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
      marginTop: 20,
      marginRight: 10, // Add margin between buttons
    },

    tarButton: {
      backgroundColor: colorScheme === 'light' ? 'black' : 'white',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
      marginTop: 20,
    },
    buttonText: {
      color: colorScheme === 'light' ? 'white' : 'black', // Set text color to white
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    chatSectionCon: {
      paddingHorizontal: 10,
      paddingVertical: 10,
      maxWidth: '80%',
      borderWidth: 1, // Add a border
      borderColor: colorScheme === 'light' ? 'lightgray' : 'white', // Set the border color
      borderRadius: 10, // Add this line for rounded edges
      alignSelf: 'flex-start',
      backgroundColor: colorScheme === 'light' ? 'lightgray' : 'white',
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
      backgroundColor: colorScheme === 'light' ? 'lightgray' : 'white',
      marginBottom: 5,
    },
    chatView: {
      paddingVertical: 10,
      borderRadius: 10,
      paddingBottom:100 
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
    },
    loadingText: {
      fontSize: 20,
      fontWeight: 'bold',
    },
  });
  return (
    <SafeAreaView style={styles.backgroundStyle}>
      <StatusBar />
      <View>
        <View style={{flexDirection: 'row', justifyContent: 'center'}}>
          <TouchableOpacity
            id="comfButton"
            style={styles.comfButton}
            onPress={() =>
              isComfRecording ? stopRecording() : startComfRecording()
            }>
            <Text style={styles.buttonText}>
              {isComfRecording
                ? `Stop \n${comfortableLang}`
                : `Speak \n${comfortableLang}`}
            </Text>
            {/* <Image
              source={require('./assets/pinterest_black.jpg')}
              style={{width: 50, height: 50}}
            /> */}
          </TouchableOpacity>
          {comfortableLang !== targetLanguage && (
            <TouchableOpacity
              id="tarButton"
              style={styles.tarButton}
              onPress={() =>
                isTarRecording ? stopRecording() : startTarRecording()
              }>
              <Text style={styles.buttonText}>
                {isTarRecording
                  ? `Stop \n${targetLanguage}`
                  : `Speak \n${targetLanguage}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{alignSelf: 'center', width: 150}}>
          <TouchableOpacity
            id="respButton"
            style={styles.button}
            onPress={handlePress}>
            <Text style={styles.buttonText}>Get Response</Text>
          </TouchableOpacity>
        </View>
        {isLoading && (
          // Show loading text or spinner while waiting for the response
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
        <View style={styles.chatView}>
          <ScrollView style={{height: '80%'}}>
            {chatResult &&
              chatResult.chatData.map((chat, index) => (
                <View key={index}>
                  <View style={styles.chatSectionCon} id="userChat">
                    <Text style={styles.concatenatedChat}>
                      {chat.concatenated_chat}
                    </Text>
                  </View>
                  <View style={styles.chatSectionResp} id="responseChat">
                    <Text style={styles.chatResponse}>{chat.chatResponse}</Text>
                  </View>
                </View>
              ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Chat;
