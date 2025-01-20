// import React from 'react';
// import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
// import { useNavigation } from '@react-navigation/native'; 
// // added for testing age verification comment out if not testing
// // import AsyncStorage from '@react-native-async-storage/async-storage';
// // import { Alert } from 'react-native';

// const LandingPage = () => {
//   const navigation = useNavigation(); 

//   const handleStartClick = () => {
//     navigation.navigate('LandingPage2'); 
//   };

//   const handleSkipClick = () => {
//     navigation.navigate('AccountSetup1Login'); 
//   };
//    // TEMP FUNCTION TO CLEAR AsyncStorage KEY comment out if not testing
//   //  const handleClearVerificationKey = async () => {
//   //   try {
//   //     await AsyncStorage.removeItem('userIsVerified');
//   //     console.log('Verification key removed. You can now test age verification again.');
//   //     Alert.alert('Key Removed', 'You can now test age verification again.');
//   //   } catch (error) {
//   //     console.error('Error removing userIsVerified key:', error);
//   //   }
//   // };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.headerText}>
//         Hello, online <Text style={styles.bold}>daters</Text>.
//         {'\n'}Are you <Text style={styles.bold}>time poor</Text>?
//       </Text>

//       <Image source={require('../assets/image1.png')} style={styles.customImage} />

//       <Text style={styles.subHeaderText}>
//         We do <Text style={styles.bold}>small talk</Text> for you.
//       </Text>

//       <Text style={styles.descriptionText}>
//         <Text style={styles.bold}>Arrange</Text> your <Text style={styles.bold}>meeting</Text> time & <Text style={styles.bold}>destination</Text>{' '}
//         through the app with only{' '}
//         <Text style={styles.bold}>automated prompting</Text>.
//       </Text>

//       <TouchableOpacity style={styles.startButton} onPress={handleStartClick}>
//         <Text style={styles.startButtonText}>Let's Start</Text>
//       </TouchableOpacity>

//       <TouchableOpacity style={styles.skipButton} onPress={handleSkipClick}>
//         <Text style={styles.skipButtonText}>Skip &gt;</Text>
//       </TouchableOpacity>
//       {/*
//         TEMPORARY BUTTON FOR TESTING:
//         removes the userIsAgeVerified key so you can see the age gate again.
//         comment out if not testing
//       */}
//       {/* <TouchableOpacity style={styles.clearButton} onPress={handleClearVerificationKey}>
//         <Text style={styles.clearButtonText}>Clear Verification Key</Text>
//       </TouchableOpacity> */}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//     alignItems: 'center',
//     justifyContent: 'center',
//     color: '#1A1A1A',
//     paddingVertical: 20,
//   },
//   headerText: {
//     fontFamily: 'Lexend-Regular',
//     fontSize: 20,
//     fontWeight: '400',
//     textAlign: 'center',
//     marginTop: 30,
//   },
//   subHeaderText: {
//     fontFamily: 'Lexend-Regular',
//     fontSize: 22,
//     fontWeight: 'normal',
//     textAlign: 'center',
//     marginTop: 10,
//   },
//   descriptionText: {
//     fontFamily: 'Lexend-Regular',
//     fontSize: 14,
//     fontWeight: 'normal',
//     textAlign: 'center',
//     marginBottom: 40,
//   },
//   bold: {
//     fontWeight: '700',
//   },
//   customImage: {
//     width: 384,
//     height: 500,
//     borderRadius: 20,
//     resizeMode: 'cover',
//     marginVertical: 15,
//   },
//   startButton: {
//     backgroundColor: '#E4423F',
//     borderRadius: 20,
//     width: 172,
//     height: 42,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginVertical: 10,
//   },
//   startButtonText: {
//     fontFamily: 'Lexend-Regular',
//     fontSize: 18,
//     color: '#FFFFFF',
//     textTransform: 'none',
//   },
//   skipButton: {
//     marginVertical: 10,
//   },
//   skipButtonText: {
//     fontFamily: 'Lexend-Bold',
//     fontSize: 12,
//     color: '#000000',
//     textTransform: 'none',
//   },
//    // NEW STYLES FOR THE CLEAR BUTTON comment out if not testing
//   //  clearButton: {
//   //   marginTop: 20,
//   //   paddingVertical: 8,
//   //   paddingHorizontal: 16,
//   //   backgroundColor: '#dddddd',
//   //   borderRadius: 10,
//   // },
//   // clearButtonText: {
//   //   fontFamily: 'Lexend-Regular',
//   //   fontSize: 14,
//   //   color: '#000',
//   //   textTransform: 'none',
//   // },
// });

// export default LandingPage;
import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const LandingPage = () => {
  const navigation = useNavigation();

  return (
    <ImageBackground source={require('../assets/image1.png')} style={styles.backgroundImage}>
      {/* Red Tint Overlay */}
      <View style={styles.redTint} />

      {/* White Card Overlay */}
      <View style={styles.overlay}>
        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          <View style={styles.activeDot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Title */}
        <Text style={styles.title}>No Boring Small Talk</Text>

        {/* Description */}
        <Text style={styles.description}>
          Too short on time to search for your soulmate?{'\n'}
          Get to know a bit about your match by checking{'\n'}
          out their profile page in advance.
        </Text>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={() => navigation.navigate('LandingPage2')}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  redTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(228, 66, 63, 0.3)', // Red tint overlay
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // More opaque for a better look
    borderRadius: 25,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '95%', // Wider to fill more space
    height: '38%', // Increased height to match image proportions
    alignSelf: 'center',
    position: 'absolute',
    bottom: '2.5%', // Moves the card further up in the image
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    padding: 10,
    top: 15, // Moves dots to the top
  },
  activeDot: {
    backgroundColor: '#E4423F',
    width: 16, // Elongated active dot
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 10,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 50,
  },
  continueButton: {
    backgroundColor: '#E4423F',
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
    width: '60%',
    marginBottom: 15,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  signUpText: {
    fontSize: 18,
    textDecorationLine: 'underline',
    color: '#1A1A1A',
    
  },
});

export default LandingPage;
