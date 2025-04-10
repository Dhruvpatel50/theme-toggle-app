import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

// Cloud component for a single cloud
const Cloud = ({ size, opacity, speed, top, delay }) => {
  // Animation value for cloud movement
  const moveAnim = useState(new Animated.Value(width))[0];
  
  useEffect(() => {
    // Start animation with delay
    const animationTimeout = setTimeout(() => {
      // Create infinite animation loop
      const startAnimation = () => {
        // Reset position
        moveAnim.setValue(width);
        
        // Animate from right to left
        Animated.timing(moveAnim, {
          toValue: -300, // Move past the left edge
          duration: speed,
          useNativeDriver: true,
          easing: Easing.linear,
        }).start(({ finished }) => {
          // When animation completes, restart
          if (finished) {
            startAnimation();
          }
        });
      };
      
      // Start the animation
      startAnimation();
    }, delay);
    
    // Clean up animation when component unmounts
    return () => {
      clearTimeout(animationTimeout);
      moveAnim.stopAnimation();
    };
  }, []);

  // Scale factor based on size (0.6 - 1.0)
  const scaleFactor = 0.6 + (size * 0.4);
  
  return (
    <Animated.View 
      style={[
        styles.cloudContainer,
        {
          opacity,
          top,
          transform: [
            { translateX: moveAnim },
            { scale: scaleFactor }
          ]
        }
      ]}
    >
      {/* Main cloud body */}
      <View style={styles.cloud}>
        {/* Cloud's bumps created with pseudo elements in CSS, implemented as Views here */}
        <View style={styles.cloudBefore} />
        <View style={styles.cloudAfter} />
      </View>
    </Animated.View>
  );
};

const Clouds = ({ isActive }) => {
  // Generate cloud configurations
  const [clouds] = useState(() => [
    // x1 cloud
    { size: 1.0, opacity: 1.0, speed: 15000, top: 100, delay: 0 },
    // x2 cloud
    { size: 0.6, opacity: 0.6, speed: 25000, top: 150, delay: 1000 },
    // x3 cloud
    { size: 0.8, opacity: 0.8, speed: 20000, top: 50, delay: 2000 },
    // x4 cloud
    { size: 0.75, opacity: 0.75, speed: 18000, top: 200, delay: 3000 },
    // x5 cloud
    { size: 0.8, opacity: 0.8, speed: 20000, top: 250, delay: 4000 },
    // Add a few more clouds for better coverage
    { size: 0.7, opacity: 0.7, speed: 22000, top: 180, delay: 5000 },
    { size: 0.9, opacity: 0.9, speed: 17000, top: 120, delay: 6000 },
  ]);

  // Return null if not active
  if (!isActive) return null;

  return (
    <View style={styles.container}>
      {/* Sky gradient background */}
      <View style={styles.skyBackground} />
      
      {/* Clouds */}
      {clouds.map((cloud, index) => (
        <Cloud 
          key={index} 
          size={cloud.size}
          opacity={cloud.opacity}
          speed={cloud.speed}
          top={cloud.top}
          delay={cloud.delay}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  skyBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: '#87CEEB', // Matches day theme
  },
  cloudContainer: {
    position: 'absolute',
    zIndex: 2,
  },
  cloud: {
    width: 200,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 100,
    position: 'relative',
  },
  cloudBefore: {
    position: 'absolute',
    backgroundColor: '#fff',
    width: 100,
    height: 80,
    top: -15,
    left: 10,
    borderRadius: 100,
    transform: [{ rotate: '30deg' }],
  },
  cloudAfter: {
    position: 'absolute',
    backgroundColor: '#fff',
    width: 120,
    height: 120,
    top: -55,
    right: 15,
    borderRadius: 100,
    transform: [{ rotate: '30deg' }],
  },
});

export default Clouds;