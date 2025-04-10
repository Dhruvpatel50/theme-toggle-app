import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Create more randomized snowflakes with greater variation
const createSnowflakes = (count) => {
  return Array(count).fill().map(() => ({
    id: Math.random().toString(),
    x: Math.random() * SCREEN_WIDTH,
    size: Math.random() * 8 + 1, // Size between 1-9
    speed: Math.random() * 6 + 1, // Speed between 1-7 (more variation)
    opacity: Math.random() * 0.7 + 0.3, // Opacity between 0.3-1
    wind: Math.random() * 4 - 2, // Wind effect between -2 and 2 (stronger wind)
    wobble: Math.random() * 3, // Random wobble factor for each snowflake
    delay: Math.random() * 5000, // Random start delay up to 5 seconds
  }));
};

// Create stars with varying brightness and positions
const createStars = (count) => {
  return Array(count).fill().map(() => ({
    id: Math.random().toString(),
    x: Math.random() * SCREEN_WIDTH,
    y: Math.random() * (SCREEN_HEIGHT * 0.7), // Only in top 70% of screen
    size: Math.random() * 2 + 0.5, // Size between 0.5-2.5
    opacity: Math.random() * 0.5 + 0.5, // Opacity between 0.5-1
    twinkle: Math.random() > 0.7, // Some stars twinkle (30%)
    twinkleSpeed: Math.random() * 2000 + 1000, // Twinkle speed between 1-3s
  }));
};

const Snowfall = ({ isActive }) => {
  // Create more snowflakes for a fuller effect
  const snowflakes = useRef(createSnowflakes(70)).current;
  const animations = useRef(snowflakes.map(() => new Animated.Value(0))).current;
  
  // Create stars
  const stars = useRef(createStars(100)).current;
  const twinkleAnimations = useRef(stars.map(() => new Animated.Value(1))).current;

  // Removed: moonGlowAnimation

  useEffect(() => {
    if (isActive) {
      // Start snowfall animations
      snowflakes.forEach((snowflake, index) => {
        // Add delay to start time for more randomness
        setTimeout(() => {
          startSnowfallAnimation(index);
        }, snowflake.delay);
      });
      
      // Start star twinkling animations
      stars.forEach((star, index) => {
        if (star.twinkle) {
          startTwinkleAnimation(index);
        }
      });
      
      // Removed: moon glow animation
    } else {
      // Stop all animations when not active
      animations.forEach(anim => {
        Animated.timing(anim).stop();
        anim.setValue(0);
      });
      
      twinkleAnimations.forEach(anim => {
        Animated.timing(anim).stop();
        anim.setValue(1);
      });
      
      // Removed: moonGlowAnimation stop
    }
    
    return () => {
      // Cleanup animations on unmount
      animations.forEach(anim => Animated.timing(anim).stop());
      twinkleAnimations.forEach(anim => Animated.timing(anim).stop());
      // Removed: moonGlowAnimation cleanup
    };
  }, [isActive]);

  const startSnowfallAnimation = (index) => {
    const snowflake = snowflakes[index];
    
    Animated.timing(animations[index], {
      toValue: 1,
      duration: 7000 + (5000 / snowflake.speed), // More variation in duration
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && isActive) {
        // Reset and restart animation with more randomization
        animations[index].setValue(0);
        // Change x position and other properties slightly for variety
        snowflakes[index].x = Math.random() * SCREEN_WIDTH;
        snowflakes[index].wind = Math.random() * 4 - 2; // New wind direction/strength
        snowflakes[index].wobble = Math.random() * 3;
        startSnowfallAnimation(index);
      }
    });
  };
  
  const startTwinkleAnimation = (index) => {
    Animated.sequence([
      Animated.timing(twinkleAnimations[index], {
        toValue: 0.3,
        duration: stars[index].twinkleSpeed,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(twinkleAnimations[index], {
        toValue: 1,
        duration: stars[index].twinkleSpeed,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    ]).start(({ finished }) => {
      if (finished && isActive && stars[index].twinkle) {
        startTwinkleAnimation(index);
      }
    });
  };

  if (!isActive) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Stars */}
      {stars.map((star, index) => (
        <Animated.View
          key={`star-${star.id}`}
          style={[
            styles.star,
            {
              width: star.size,
              height: star.size,
              left: star.x,
              top: star.y,
              opacity: star.twinkle ? twinkleAnimations[index] : star.opacity,
              backgroundColor: '#ffffff',
            }
          ]}
        />
      ))}
      
      {/* Removed: Moon */}
      
      {/* Snowflakes */}
      {snowflakes.map((snowflake, index) => {
        const translateY = animations[index].interpolate({
          inputRange: [0, 1],
          outputRange: [-50, SCREEN_HEIGHT + 50]
        });
        
        // Add more complex movement with stronger wind and wobble
        const translateX = animations[index].interpolate({
          inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
          outputRange: [
            snowflake.x,
            snowflake.x + (snowflake.wobble * 2) + (snowflake.wind * 5),
            snowflake.x - (snowflake.wobble) + (snowflake.wind * 10),
            snowflake.x + (snowflake.wobble * 3) + (snowflake.wind * 15),
            snowflake.x - (snowflake.wobble * 2) + (snowflake.wind * 20),
            snowflake.x + snowflake.wind * 25
          ]
        });

        return (
          <Animated.View
            key={`snow-${snowflake.id}`}
            style={[
              styles.snowflake,
              {
                width: snowflake.size,
                height: snowflake.size,
                opacity: snowflake.opacity,
                transform: [
                  { translateX },
                  { translateY }
                ]
              }
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  snowflake: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 50,
  },
  star: {
    position: 'absolute',
    borderRadius: 50,
  }
  // Removed: All moon-related styles
});

export default Snowfall;