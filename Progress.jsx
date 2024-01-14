import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Appearance,
  TouchableOpacity,
} from 'react-native';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';

export default function Progress({
  chapters,
  response,
  progressResp,
  targetLanguage,
  comfortableLang,
}) {
  const [height, setHeight] = useState(60);
  const [extraHeight, setExtraHeight] = useState(150);
  const [result, setResult] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [sound, setSound] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [localResponse, setLocalResponse] = useState(response);
  const [loadingDots, setLoadingDots] = useState(1);

  useEffect(() => {
    // Update localResponse if the response prop changes
    setLocalResponse(response);
    setResult('');
  }, [response]);

  const onLayout = event => {
    const {height: measuredHeight} = event.nativeEvent.layout;
    const increasedHeight = measuredHeight + measuredHeight / 3;
    setHeight(measuredHeight);
    setExtraHeight(increasedHeight);
  };

  const indiExplanation = async item => {
    setResult('');
    setIsLoadingContent(true);
    setSelectedItem(item);
    setLocalResponse('');
    const formData = new FormData();
    formData.append('item', item);
    formData.append('tarLang', targetLanguage);
    formData.append('comfLang', comfortableLang);
    try {
      const audioResponse = await fetch(
        `http://127.0.0.1:5001/indiExplanation`,
        {
          method: 'POST',
          body: formData,
        },
      );
      const data = await audioResponse.json();
      if (data.llm_status === 'failed') {
        setIsLoadingContent(false);
        Alert.alert(
          'Due to high demand we are facing some issue, please try again with a new recording',
        );
        return;
      }
      setResult(data.indiExplainedContent);
      const audioData = data.audio;
      if (data.audio != null) {
        const audioFilePath = await saveAudioToLocalFile(audioData);

        if (audioFilePath) {
          playAudio(audioFilePath);
        }
      }
      setIsLoadingContent(false);
    } catch (error) {
      console.error(error);
    }
  };
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
        newSound.play(async success => {
          if (!success) {
            console.error('Error playing sound');
          } else {
          }
          newSound.release();
        });
      }
    });
    setSound(newSound);
  };
  function insertLineBreaks(str, maxLength) {
    if (str.length > maxLength) {
      return str.slice(0, maxLength) + '\n' + str.slice(maxLength);
    }
    return str;
  }
  const MAX_LENGTH = 20; // Adjust this value as needed

  useEffect(() => {
    let interval;
    if (isLoadingContent) {
      // Start the interval when loading is true
      interval = setInterval(() => {
        setLoadingDots(prevDots => (prevDots % 3) + 1); // Cycle through 1, 2, 3
      }, 1000);
    } else {
      // Clear the interval when loading is false
      clearInterval(interval);
    }
    return () => clearInterval(interval); // Cleanup the interval on component unmount
  }, [isLoadingContent]);
  const loadingText = `Preparing${'.'.repeat(loadingDots)}`; // Create loading text with dots

  const colorScheme = Appearance.getColorScheme();
  const styles = StyleSheet.create({
    backgroundStyle: {
      backgroundColor: colorScheme === 'light' ? '#D3D3D0' : '#E7CE9E',
    },
    chatSectionResp: {
      // paddingVertical: 5,
      maxWidth: '85%',
      borderColor: colorScheme === 'light' ? '#E7CE9E' : '#B4B435',
      borderRadius: 10,
      color: colorScheme === 'light' ? 'white' : 'black',
      alignSelf: 'flex-end',
      backgroundColor: colorScheme === 'light' ? '#E7CE9E' : '#B4B435',
      marginBottom: 5,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      backgroundColor: colorScheme === 'light' ? 'white' : 'lightgrey',
      alignSelf: 'center',
    },
    loadingText: {
      fontSize: 20,
      fontWeight: 'bold',
      paddingHorizontal: 15,
      color:'black'
    },
    chapterContainer: {
      backgroundColor: colorScheme === 'light' ? '#927E5D' : '#EC5C22',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
      paddingRight: 10,
      height: 'auto',
      verticalAlign: 'middle',
    },
    topicContainer: {
      backgroundColor: colorScheme === 'light' ? '#CC8A1D' : '#C4920B',
      borderRadius: 20,
      paddingVertical: 2,
      paddingHorizontal: 10,
      height: 'auto',
      verticalAlign: 'middle',
    },
  });

  if (!Array.isArray(chapters) || chapters.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{fontSize: 18, fontWeight: 'bold'}}>
          No chapters available.
        </Text>
      </View>
    );
  }
  // Function to check if a chapter or topic is before the current one
  const isBeforeCurrent = (chapterIndex, topicIndex = -1) => {
    const currentChapterIndex = chapters.findIndex(
      ch => ch.name === progressResp?.chapter_name,
    );
    if (topicIndex === -1) {
      return chapterIndex < currentChapterIndex;
    }
    const currentTopicIndex = chapters[currentChapterIndex]?.topics.findIndex(
      tp => tp.name === progressResp?.topics,
    );
    return (
      chapterIndex < currentChapterIndex ||
      (chapterIndex === currentChapterIndex && topicIndex < currentTopicIndex)
    );
  };

  let chapterList = chapters.map((chapter, chapterIndex) => {
    let isCurrentChapter = chapter.name === progressResp?.chapter_name;
    let formattedChapterName = insertLineBreaks(chapter.name, MAX_LENGTH);
    return (
      <View key={chapter.id} style={{flexDirection: 'row', marginBottom: 10}}>
        <View id="top">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 25,
              paddingBottom: 5,
              backgroundColor: isCurrentChapter
                ? 'green'
                : isBeforeCurrent(chapterIndex)
                ? 'blue'
                : 'brown',
              marginBottom: 10,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                fontWeight: 'bold',
              }}>
              {chapterIndex + 1}
            </Text>
          </View>
          {chapterIndex !== chapters.length - 1 && (
            <View
              id="chapterLine"
              style={{
                width: 6,
                height: isCurrentChapter ? extraHeight : 120,
                backgroundColor: isCurrentChapter
                  ? 'green'
                  : isBeforeCurrent(chapterIndex)
                  ? 'blue'
                  : 'orange',
                marginLeft: 12,
                borderRadius: 3,
              }}
            />
          )}
        </View>
        <View>
          <View style={{flex: 1, marginLeft: 10}}>
            <View style={{paddingBottom:5}}>
            <View style={styles.chapterContainer}>
              <TouchableOpacity onPress={() => indiExplanation(chapter.name)}>
                <Text
                  style={{
                    fontWeight: 'bold',
                    fontSize: 23,
                    // paddingLeft: 7,
                    color: isCurrentChapter
                      ? 'green'
                      : isBeforeCurrent(chapterIndex)
                      ? 'blue'
                      : colorScheme === 'light'
                      ? 'black'
                      : 'black',
                  }}>
                  {formattedChapterName}
                </Text>
              </TouchableOpacity>
            </View>
            </View>
            {selectedItem === chapter.name && (
              <View style={styles.chatSectionResp}>
                <Text>{result}</Text>
              </View>
            )}
            <View style={{marginLeft: 10}}>
              {chapter.topics.map((topic, topicIndex) => {
                let isCurrentTopic =
                  isCurrentChapter && topic.name === progressResp?.topics;
                let formattedTopicName = insertLineBreaks(
                  topic.name,
                  MAX_LENGTH,
                );
                return (
                  <View
                    key={topicIndex}
                    style={{flexDirection: 'row', paddingTop: 10}}>
                    {/* Topic line */}
                    <View>
                      <View
                        id="topicLine"
                        style={{
                          height: isCurrentTopic ? height : 60,
                          width: 6,
                          backgroundColor: isCurrentTopic
                            ? 'green'
                            : isBeforeCurrent(chapterIndex, topicIndex)
                            ? 'blue'
                            : 'orange',
                          marginLeft: 5,
                          marginVertical: 5,
                          borderRadius: 3,
                        }}
                      />
                    </View>
                    {/* Topic text */}
                    <View style={{paddingLeft: 5, flexDirection: 'column'}}>
                      <View style={{paddingBottom: 5}}>
                        <View style={styles.topicContainer}>
                          <TouchableOpacity
                            onPress={() => indiExplanation(topic.name)}>
                            <Text
                              style={{
                                fontWeight: 'bold',
                                fontSize: 18,
                                color: isCurrentTopic
                                  ? 'green'
                                  : isBeforeCurrent(chapterIndex, topicIndex)
                                  ? 'blue'
                                  : colorScheme === 'light'
                                  ? 'black'
                                  : 'black',
                              }}>
                              → {formattedTopicName}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {isCurrentTopic && !result && (
                        <View
                          onLayout={onLayout}
                          style={styles.chatSectionResp}>
                          <Text>{localResponse}</Text>
                        </View>
                      )}
                      {selectedItem === topic.name && (
                        <View style={styles.chatSectionResp}>
                          <Text >{result}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  });

  return (
    <View style={styles.backgroundStyle}>
      <ScrollView style={{padding: 3, height: '100%'}}>
        {isLoadingContent && (
          // Show loading text or spinner while waiting for the response
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        )}
        {chapterList}
      </ScrollView>
    </View>
  );
}
