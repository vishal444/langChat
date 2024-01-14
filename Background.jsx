import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const randomPosition = (size) => {
  return {
    top: Math.random() * (screenHeight - size),
    left: Math.random() * (screenWidth - size)
  };
};

export const homeStyle = StyleSheet.create({
  background: {
    flex: 1,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  circle: (size) => ({
    position: 'absolute',
    borderRadius: size / 2,
    opacity: 0.5,
    backgroundColor: '#0D1BF7',
    width: size,
    height: size,
    ...randomPosition(size),
  }),
  topRectangle: {
    width: '100%', // Width of the rectangle
    height: 160, // Height of the rectangle
    backgroundColor: '#A6B4F2', // Background color
    // borderWidth: 2, // Border width
    // borderColor: 'black', // Border color
    borderRadius: 20, // Border radius for rounded corners
    justifyContent: 'center', // Align content vertically
    alignItems: 'center', // Align content horizontally
    // shadowColor: '#000', // Shadow color
    // shadowOffset: { width: 0, height: 1 }, // Shadow offset
    // shadowOpacity: 0.2, // Shadow opacity
    // shadowRadius: 1.5, // Shadow radius
    elevation: 3, // Elevation for Android
  }
});

const Background = () => {
  return (
    <View style={homeStyle.background}>
      <View style={homeStyle.circle(100)} />
      <View style={homeStyle.circle(150)} />
      <View style={homeStyle.circle(120)} />
      <View style={homeStyle.circle(90)} />
      <View style={homeStyle.circle(20)} />
      <View style={homeStyle.circle(25)} />
      <View style={homeStyle.circle(30)} />
      {/* Add more circles or adjust sizes as needed */}
    </View>
  );
};

export default Background;
