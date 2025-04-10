import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Snowfall from './components/Snowfall';
import Clouds from './components/Clouds';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { FontAwesome } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Local storage key constant
const NIGHT_MODE_STORAGE_KEY = 'NIGHT_MODE_ENABLED';

const App = () => {
  const [isNightMode, setIsNightMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const switchAnim = useRef(new Animated.Value(0)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;
  const celestialOpacity = useRef(new Animated.Value(1)).current;
  const textOpacityAnim = useRef(new Animated.Value(1)).current;
  const sunRotateAnim = useRef(new Animated.Value(0)).current;
  const sunScaleAnim = useRef(new Animated.Value(1)).current;
  const sunRaysPulse = useRef(new Animated.Value(0.8)).current;
  const micPulse = useRef(new Animated.Value(1)).current;
  const plantsOpacity = useRef(new Animated.Value(1)).current;

  // Recording object reference
  const recording = useRef(null);

  useEffect(() => {
    loadNightModeSettings();
    setupAudio();
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (err) {
      console.error('Failed to setup audio', err);
      Alert.alert('Permission Required', 'Microphone permissions are needed for voice commands');
    }
  };

  // Improved animation sequence for smoother transition
  useEffect(() => {
    // First, only fade background color without affecting other elements
    Animated.timing(bgAnim, {
      toValue: isNightMode ? 1 : 0,
      duration: 600,
      useNativeDriver: false,
    }).start();

    // Then handle celestial bodies and plants with proper opacity transitions
    Animated.parallel([
      Animated.timing(celestialOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(plantsOpacity, {
        toValue: isNightMode ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After fade out, switch mode and fade in
      Animated.parallel([
        Animated.timing(switchAnim, {
          toValue: isNightMode ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(celestialOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [isNightMode]);

  useEffect(() => {
    if (!isNightMode) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sunRaysPulse, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(sunRaysPulse, {
            toValue: 0.8,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(sunScaleAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(sunScaleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      sunRaysPulse.setValue(0.8);
      sunScaleAnim.setValue(1);
    }
  }, [isNightMode]);

  // Pulse animation for microphone button when listening
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(micPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      micPulse.setValue(1);
    }
  }, [isListening]);

  // Simplified function to load night mode setting
  const loadNightModeSettings = async () => {
    try {
      const storedValue = await AsyncStorage.getItem(NIGHT_MODE_STORAGE_KEY);
      // Set night mode to true only if the stored value is explicitly "true"
      setIsNightMode(storedValue === 'true');
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading night mode setting:', error);
      // Default to day mode if there's an error
      setIsNightMode(false);
      setIsLoading(false);
    }
  };

  // Simplified function to save night mode setting
  const saveNightModeSetting = async (isEnabled) => {
    try {
      await AsyncStorage.setItem(NIGHT_MODE_STORAGE_KEY, isEnabled.toString());
      console.log('Night mode setting saved:', isEnabled);
    } catch (error) {
      console.error('Error saving night mode setting:', error);
    }
  };

  const toggleNightMode = async () => {
    console.log('Toggle pressed, current mode:', isNightMode);
    const newNightModeState = !isNightMode;
    setIsNightMode(newNightModeState);

    // Provide vocal feedback
    const message = newNightModeState 
      ? 'Switching to night mode' 
      : 'Switching to day mode';
    provideFeedback(message);

    // Save the new night mode state
    saveNightModeSetting(newNightModeState);
  };

  const startListening = async () => {
    try {
      if (isListening) {
        await stopListening();
        return;
      }

      setIsListening(true);
      setFeedbackMessage('Listening...');

      recording.current = new Audio.Recording();
      await recording.current.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.current.startAsync();

      // Set a timeout to stop listening after 5 seconds
      setTimeout(() => {
        if (isListening) {
          stopListening();
        }
      }, 5000);

    } catch (err) {
      console.error('Failed to start recording', err);
      stopListening();
      setFeedbackMessage('Voice recognition failed');
    }
  };

  const stopListening = async () => {
    try {
      if (!recording.current) return;

      setIsListening(false);
      setFeedbackMessage('Processing...');

      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null;

      if (!uri) {
        setFeedbackMessage('No audio detected');
        return;
      }

      // Here we would normally send the audio to a speech-to-text service
      // For this example, we'll simulate speech recognition
      simulateSpeechRecognition(uri);

    } catch (err) {
      console.error('Failed to stop recording', err);
      setFeedbackMessage('Failed to process voice command');
      setIsListening(false);
    }
  };

  // Simulate speech recognition (in a real app, you'd use a proper STT service)
  const simulateSpeechRecognition = (audioUri) => {
    // Simulating a 1-second delay for processing
    setTimeout(() => {
      // Randomly choose between day and night commands for the simulation
      const commands = ['switch to day', 'switch to night', 'day mode', 'night mode'];
      const recognizedCommand = commands[Math.floor(Math.random() * commands.length)];

      setRecognizedText(recognizedCommand);
      processVoiceCommand(recognizedCommand);
    }, 1000);
  };

  const processVoiceCommand = (command) => {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('night') || lowerCommand.includes('dark')) {
      if (!isNightMode) {
        setIsNightMode(true);
        provideFeedback('Switching to night mode');
        saveNightModeSetting(true);
      } else {
        provideFeedback('Already in night mode');
      }
    }
    else if (lowerCommand.includes('day') || lowerCommand.includes('light')) {
      if (isNightMode) {
        setIsNightMode(false);
        provideFeedback('Switching to day mode');
        saveNightModeSetting(false);
      } else {
        provideFeedback('Already in day mode');
      }
    }
    else {
      provideFeedback('Command not recognized. Try "switch to day" or "switch to night"');
    }
  };

  const provideFeedback = (message) => {
    setFeedbackMessage(message);
    Speech.speak(message, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
    });

    // Clear feedback message after 3 seconds
    setTimeout(() => {
      setFeedbackMessage('');
    }, 3000);
  };

  const switchTranslate = switchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#87CEEB', '#000'],
  });

  const sunRotate = sunRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: '#66D0FF' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isNightMode ? 'light-content' : 'dark-content'} />

      <Snowfall isActive={isNightMode} />
      <Clouds isActive={!isNightMode} />

      {/* Plants image at the bottom for day mode */}
      {!isNightMode && (
        <Animated.Image
          source={require('./assets/plant.png')}
          style={[
            styles.plantsImage,
            { opacity: plantsOpacity }
          ]}
          resizeMode="cover"
        />
      )}

      {isNightMode && (
        <Animated.View
          style={[
            styles.celestialBody,
            { opacity: celestialOpacity },
          ]}
        >
          <View style={styles.moonWrapper}>
            <Image
              source={require('./assets/moon3.png')}
              style={styles.moonImage}
            />
          </View>
        </Animated.View>
      )}

      {!isNightMode && (
        <Animated.View
          style={[
            styles.celestialBody,
            {
              opacity: celestialOpacity,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.sunRaysContainer,
              {
                transform: [{ rotate: sunRotate }],
                opacity: sunRaysPulse,
              },
            ]}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.sunRayDash,
                  {
                    transform: [
                      { rotate: `${i * 30}deg` },
                      { translateX: 65 },
                    ],
                    width: i % 2 === 0 ? 25 : 15,
                  },
                ]}
              />
            ))}
          </Animated.View>

          <Animated.View
            style={[
              styles.sunBody,
              {
                transform: [{ scale: sunScaleAnim }],
              },
            ]}
          >
            <View style={styles.sunFace}>
              <View style={styles.sunEyes}>
                <View style={styles.sunEye} />
                <View style={styles.sunEye} />
              </View>
              <View style={styles.sunMouth} />
              <View style={styles.sunCheeks}>
                <View style={styles.sunCheek} />
                <View style={styles.sunCheek} />
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* Voice command feedback */}
      {feedbackMessage ? (
        <Animated.Text
          style={[
            styles.feedbackText,
            {
              color: isNightMode ? '#A0D3FF' : '#FFD700',
              opacity: textOpacityAnim,
            },
          ]}
        >
          {feedbackMessage}
        </Animated.Text>
      ) : null}

      {/* Voice Command Button with FontAwesome Icon */}
      <TouchableOpacity
        onPress={startListening}
        style={[
          styles.voiceButton,
          { backgroundColor: isNightMode ? '#4a90e2' : '#FFD700' }
        ]}
      >
        <Animated.View
          style={[
            styles.micIconContainer,
            {
              transform: [{ scale: micPulse }],
              backgroundColor: isListening
                ? (isNightMode ? '#83a4ff' : '#FFD700')
                : (isNightMode ? '#fff' : '#FF8C00')
            },
          ]}
        >
          {/* FontAwesome microphone icon */}
          <FontAwesome 
            name="microphone" 
            size={24} 
            color="#333" 
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Toggle Switch - Now positioned below the microphone button */}
      <View style={styles.switchWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleNightMode}
          style={styles.switchTouchable}
        >
          <Animated.View
            style={[
              styles.switchContainer,
              {
                backgroundColor: isNightMode ? '#4a90e2' : '#FFD700',
                shadowColor: isNightMode ? '#83a4ff' : '#FFD700',
                shadowOpacity: isNightMode ? 0.5 : 0.3,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.switchThumb,
                {
                  transform: [{ translateX: switchTranslate }],
                  backgroundColor: isNightMode ? '#fff' : '#FF8C00',
                },
              ]}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    position: 'absolute',     
    top: 50,                   
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    width: '100%',
    zIndex: 20,
  },
  feedbackText: {
    position: 'absolute',       
    bottom: 150,                
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    width: '100%',
    zIndex: 20,
  },
  switchWrapper: {
    zIndex: 100,
    elevation: 100,
    marginTop: 30,
  },
  switchTouchable: {
    padding: 10,
  },
  switchContainer: {
    width: 60,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    paddingHorizontal: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  switchThumb: {
    width: 30,
    height: 30,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
  },
  celestialBody: {
    position: 'absolute',
    top: 60,
    right: 40,
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  moonWrapper: {
    width: 80,
    height: 80,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 5,
  },
  moonImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    zIndex: 20,
  },
  sunRaysContainer: {
    position: 'absolute',
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunRayDash: {
    position: 'absolute',
    width: 15,
    height: 5,
    backgroundColor: '#FF9F1C',
    borderRadius: 3,
  },
  sunBody: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFDE59',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFDE59',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  sunFace: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunEyes: {
    flexDirection: 'row',
    width: 30,
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  sunEye: {
    width: 5,
    height: 8,
    backgroundColor: 'black',
    borderRadius: 2,
  },
  sunMouth: {
    width: 14,
    height: 7,
    backgroundColor: '#FF8383',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: 2,
  },
  sunCheeks: {
    flexDirection: 'row',
    width: 40,
    justifyContent: 'space-between',
    position: 'absolute',
    top: 25,
  },
  sunCheek: {
    width: 8,
    height: 4,
    backgroundColor: '#FF8383',
    borderRadius: 4,
  },
  voiceButton: {
    zIndex: 11,
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  micIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
  },
  plantsImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 350,         // full screen width
    height: 250,          // or adjust as per design
    zIndex: 10,
  }  
});

export default App;