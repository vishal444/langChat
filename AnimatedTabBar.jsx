import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, Text, View, StyleSheet } from 'react-native';

const AnimatedTabBar = ({ state, descriptors, navigation }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const scales = state.routes.map((_, index) => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    const tabWidth = 100;
    const animations = state.routes.map((_, index) => {
      return Animated.parallel([
        Animated.timing(translateX, {
          toValue: state.index * tabWidth,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scales[index], {
          toValue: state.index === index ? 1.2 : 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]);
    });
    Animated.sequence(animations).start();
  }, [state.index, translateX, scales]);

  const styles = StyleSheet.create({
    tabContainer: {
      flexDirection: 'row',
      height: 50,
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    underlineStyle: {
      position: 'absolute',
      height: 2,
      width: 100, // Same as tab width
      backgroundColor: 'blue',
      bottom: 0,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <View style={styles.tabBar}>
      <Animated.View
        style={[styles.underlineStyle, { transform: [{ translateX }] }]}
      />
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const onPress = () => navigation.navigate(route.name);

        return (
          <Animated.View style={{ transform: [{ scale: scales[index] }] }} key={route.key}>
            <TouchableOpacity onPress={onPress} style={styles.tab}>
              <Text style={{ color: isFocused ? 'blue' : 'black' }}>
                {route.name}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

export default AnimatedTabBar;
