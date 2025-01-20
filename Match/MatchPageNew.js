import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Pressable,

} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

// If you have your images locally, you can import/require them:
const male1 = require('../src/Assets/Images/img2.png');
const Tiffany = require('../src/Assets/Images/Tiffany.jpeg');




const MatchPageNew = () => {
    const navigation = useNavigation();
    const handleKeepExploring = () => {
        navigation.navigate('MatchResultsPage');
    }
  return (
    <LinearGradient colors={['#FC6767', '#EC008C']} style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>It’s a Match!</Text>
      <Text style={styles.subtitle}>You and Gemma have liked each other.</Text>

      {/* Images container */}
      <View style={styles.imagesContainer}>
        {/* Left circular image */}
        <View style={[styles.imageWrapper, { zIndex: 2, marginRight: -20 }]}>
          <Image source={male1} style={styles.image} />
        </View>
        {/* Right circular image */}
        <View style={[styles.imageWrapper, { zIndex: 1, marginLeft: -20 }]}>
          <Image source={Tiffany} style={styles.image} />
        </View>
      </View>

      {/* Button: Set up our date */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Set up our date</Text>
      </TouchableOpacity>

      {/* Link: Keep exploring */}
      <TouchableOpacity
        onPress={handleKeepExploring}
      >
        <Text style={styles.link}>Keep exploring</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 24,
  },
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  imageWrapper: {
    width: 140,
    height: 140,
    borderWidth: 4,
    borderColor: '#fff',
    borderRadius: 70, // This makes the image circular
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 16,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  link: {
    color: '#fff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default MatchPageNew;
