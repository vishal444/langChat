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
  comfortableLang
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
        `http://3.7.217.207/indiExplanation`,
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
    button: {
      backgroundColor: colorScheme === 'light' ? 'black' : 'white',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
    },
    chatSectionResp: {
      paddingVertical: 5,
      maxWidth: '97%',
      borderColor: colorScheme === 'light' ? '#E7CE9E' : '#B4B435',
      borderRadius: 10,
      color: colorScheme === 'light' ? 'white' : 'black',
      alignSelf: 'flex-end',
      backgroundColor: colorScheme === 'light' ? '#E7CE9E' : '#B4B435',
      marginBottom: 5,
    },
    chatView: {
      paddingVertical: 10,
      borderRadius: 10,
      paddingBottom: 100,
    },
    chatResponse: {
      color: colorScheme === 'light' ? 'white' : 'black',
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      backgroundColor: colorScheme === 'light' ? 'lightgrey' : 'white',
      alignSelf: 'center'
    },
    loadingText: {
      fontSize: 20,
      fontWeight: 'bold',
      paddingHorizontal: 15
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

    return (
      <View key={chapter.id} style={{flexDirection: 'row', marginBottom: 10}}>
        <View id="top">
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
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
                fontWeight:'bold'
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
            <TouchableOpacity onPress={() => indiExplanation(chapter.name)}>
              <Text
                style={{
                  fontWeight: 'bold',
                  fontSize: 25,
                  color: isCurrentChapter
                    ? 'green'
                    : isBeforeCurrent(chapterIndex)
                    ? 'blue'
                    : colorScheme === 'light' ? 'black' : 'black',
                }}>
                {chapter.name}
              </Text>
            </TouchableOpacity>
            {selectedItem === chapter.name && (
              <View style={styles.chatSectionResp}>
                <Text>{result}</Text>
              </View>
            )}
            <View style={{marginLeft: 10}}>
              {chapter.topics.map((topic, topicIndex) => {
                let isCurrentTopic =
                  isCurrentChapter && topic.name === progressResp?.topics;
                return (
                  <View key={topicIndex} style={{flexDirection: 'row'}}>
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
                    <View>
                      <TouchableOpacity
                        onPress={() => indiExplanation(topic.name)}>
                        <Text
                          style={{
                            fontWeight: 'bold',
                            fontSize: 20,
                            color: isCurrentTopic
                              ? 'green'
                              : isBeforeCurrent(chapterIndex, topicIndex)
                              ? 'blue'
                              : colorScheme === 'light' ? 'black' : 'black',
                          }}>
                          → {topic.name}
                        </Text>
                      </TouchableOpacity>
                      {isCurrentTopic && !result && (
                        <View
                          onLayout={onLayout}
                          style={styles.chatSectionResp}>
                          <Text>{localResponse}</Text>
                        </View>
                      )}
                      {selectedItem === topic.name && (
                        <View style={styles.chatSectionResp}>
                          <Text>{result}</Text>
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
    <ScrollView style={{padding: 20, height: '100%'}}>
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
