import React, { useRef } from 'react';
import { useRoute,useNavigation } from '@react-navigation/native';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import MatchPopUp from './MatchPopUp';
import Info from './Info';
import profile from '../src/Assets/Images/profile.png';
import img1Img from '../src/Assets/Images/img1.png';
import img2Img from '../src/Assets/Images/img2.png';
import img3Img from '../src/Assets/Images/img3.png';
import heightImg from '../src/Assets/Images/height.png';
import genderImg from '../src/Assets/Images/gender.png';
import faithImg from '../src/Assets/Images/faith.png';
import starImg from '../src/Assets/Images/star.png';
import multiImg from '../src/Assets/Images/multi.png';
import hatImg from '../src/Assets/Images/hat.png';
import heartImg from '../src/Assets/Images/heart.png';
import jobImg from '../src/Assets/Images/job.png';
import drinkImg from '../src/Assets/Images/drink.png';
import smokeImg from '../src/Assets/Images/smoke.png';
import flagImg from '../src/Assets/Images/flag.png';
import redlike from '../src/Assets/Images/redlike.png';
import redliked from '../src/Assets/Images/redliked.png';
const ViewProfile = ({ setIsFlipped, liked, onClick, isLiked, showPopup, AccountUser }) => {
    const route = useRoute();
    const { user } = route.params || {};  // Fetch user passed via navigation
    // Check if user data exists and fallback to default values if not.
    const name = user?.user_first_name && user?.user_last_name
        ? `${user.user_first_name} ${user.user_last_name}`
        : 'Unknown Name';
    const age = user?.user_age || 'Unknown Age';
    const gender = user?.user_gender || 'Unknown Gender';
    const where = user?.user_suburb || 'Unknown Location';
    const height = user?.user_height || 'Unknown Height';
    const religion = user?.user_religion || 'Unknown Religion';
    const sign = user?.user_star_sign || 'Unknown Sign';
    const sexuality = user?.user_sexuality || 'Unknown Sexuality';
    const openTo = user?.user_open_to || 'Unknown Status';
    const education = user?.user_education || 'Unknown Education';
    const heart = user?.user_body_composition || 'Unknown Body Composition';
    const job = user?.user_job || 'Unknown Job';
    const drink = user?.user_drinking || 'Unknown Drinking';
    const smoke = user?.user_smoking || 'Unknown Smoking';
    const flag = user?.user_nationality || 'Unknown Nationality';
    const popupRef = useRef(null);
    const navigation = useNavigation();
    console.log('User Data:', user);  // Log the user data to debug

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {showPopup && (
                <View style={styles.popup}>
                    <View style={styles.popupContent} ref={popupRef}>
                        <MatchPopUp user={user} AccountUser={AccountUser} />
                    </View>
                </View>
            )}
            
            <View style={styles.header}>
                {isLiked && <Image source={redliked} style={styles.likedIcon} />}
                <TouchableOpacity onPress={onClick}>
                    <Image source={liked ? redliked : redlike} style={styles.likeIcon} />
                </TouchableOpacity>
            </View>

            <View style={styles.imageContainer}>
                <Image source={img1Img} style={styles.image} />
                <Image source={img3Img} style={styles.image} />
            </View>

            <View style={styles.imageContainer}>
                <Image source={img2Img} style={styles.image} />
            </View>

            <Text style={styles.nameText}>{name}</Text>
            <Text style={styles.detailsText}>{`${age} - ${gender} - ${where}`}</Text>

            <View style={styles.interestsSection}>
                <Text style={styles.sectionTitle}>Interests</Text>
                <View style={styles.interestsContainer}>
                    {/* Add user interests here */}
                </View>
                <Text style={styles.sectionTitle}>...</Text>
                <Text style={styles.descriptionText}>
                    Lorem ipsum dolor sit amet, consetetur sadipscing elitr,
                    sed diam nonumy eirmod tempor invidunt ut.
                    Consetetur sadipscing elitr, sed diam nonumy eirmod
                    tempor invidunt ut.
                </Text>

                <Info img={heightImg} info={height} />
                <Info img={genderImg} info={gender} />
                <Info img={faithImg} info={religion} />
                <Info img={starImg} info={sign} />
                <Info img={multiImg} info={sexuality}/>
                {/* <Info img={multiImg} info={openTo} /> */}
                <Info img={hatImg} info={education} />
                <Info img={heartImg} info={heart} />
                <Info img={jobImg} info={job} />
                <Info img={drinkImg} info={drink} />
                <Info img={smokeImg} info={smoke} />
                <Info img={flagImg} info={flag} />
            </View>
            <View style={styles.buttonsContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('Match')}>
                    <Text style={styles.button}>Match Me</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.videoSection}>
                <TouchableOpacity onPress={() => setIsFlipped(false)}>
                    <Text style={styles.videoText}>Tap To See Video</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 130,
        backgroundColor: '#E4423F',
        borderRadius: 25,
        height: 45,
        color: 'white',
        textAlign: 'center',
        lineHeight: 45, // Centers text vertically
        marginBottom: 20,
        fontSize: 18,
        fontFamily: 'Segoe UI',
        
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    descriptionText: {
        fontSize: 14,
        marginBottom: 20,
    },
    detailsText: {
        fontSize: 20,
        marginBottom: 20,
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 20,
    },
    image: {
        height: 200,
        width: '48%',
    },
    imageContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    interestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    interestsSection: {
        marginBottom: 20,
    },
    likeIcon: {
        height: 30,
        position: 'absolute',
        right: '5%',
        top: '1%',
        width: 30,
    },
    likedIcon: {
        height: 30,
        left: '5%',
        position: 'absolute',
        top: '1%',
        width: 30,
    },
    nameText: {
        fontFamily: 'Lexend',
        fontSize: 30,
        marginBottom: 10,
        textAlign: 'center',
    },
    popup: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        bottom: 0,
        justifyContent: 'center',
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
    },
    popupContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 10,
    },
    videoSection: {
        alignItems: 'center',
        marginTop: 20,
    },
    videoText: {
        fontFamily: 'Lexend',
        fontSize: 18,
        marginTop: 10,
    },
});

export default ViewProfile;
