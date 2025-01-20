// import React from 'react';
// import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
// import { useNavigation } from '@react-navigation/native'; 

// const LandingPage = () => {
//   const navigation = useNavigation(); 

//   const handleStartClick = () => {
//     navigation.navigate('LandingPage4'); 
//   };

//   const handleSkipClick = () => {
//     navigation.navigate('AccountSetup1Login'); 
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.headerText}>
//         Get to know your matches <Text style={styles.bold}>better</Text> with {'\n'} a profile 
//         and <Text style={styles.bold}>recording</Text> updated <Text style={styles.bold}>yearly</Text>.
//       </Text>

//       <Image source={require('../assets/image3.png')} style={styles.customImage} />

//       <Text style={styles.descriptionText}>
//         No <Text style={styles.bold}>disappointment</Text> that they {'\n'} look <Text style={styles.bold}>nothing</Text> like their profile.
//       </Text>

//       <TouchableOpacity style={styles.startButton} onPress={handleStartClick}>
//         <Text style={styles.startButtonText}>Let's Match</Text>
//       </TouchableOpacity>

//       <TouchableOpacity style={styles.skipButton} onPress={handleSkipClick}>
//         <Text style={styles.skipButtonText}>Skip &gt;</Text>
//       </TouchableOpacity>
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
//     marginTop: '30px'
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
// });

// export default LandingPage;
import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const LandingPage3 = () => {
  const navigation = useNavigation();

  return (
    <ImageBackground source={require('../assets/image3.png')} style={styles.backgroundImage}>
      {/* Red Tint Overlay */}
      <View style={styles.redTint} />

      {/* White Card Overlay */}
      <View style={styles.overlay}>
        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.activeDot} />
          <View style={styles.dot} />
        </View>

        {/* Title */}
        <Text style={styles.title}>No Misleading Profiles</Text>

        {/* Description */}
        <Text style={styles.description}>
          Wary of being catfished? Don’t be! MeetMeUp{'\n'}
          requires every user to upload a video of{'\n'}
          themselves to their profile, updated yearly.
        </Text>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={() => navigation.navigate('LandingPage4')}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        {/* Log In Link */}
        <Text style={styles.loginText}>
          Already have an account? <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>Log In</Text>
        </Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Slightly translucent white card
    borderRadius: 25,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '95%', // Adjusted width
    height: '38%', // Increased height
    alignSelf: 'center',
    position: 'absolute',
    bottom: '2.5%', // Moves the card higher
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    padding: 10,
    top: 15, // Moves dots to the top
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    marginHorizontal: 4,
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
    width: '60%', // Reduced button width
    marginBottom: 15,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loginText: {
    fontSize: 16,
    color: '#4A4A4A',
    marginTop: 10,
  },
  loginLink: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    color: '#E4423F',
  },
});

export default LandingPage3;
