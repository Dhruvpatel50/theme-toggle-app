import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Dimensions, PanResponder } from 'react-native';

const RealisticSpiderCursor = () => {
  const position = useRef(new Animated.ValueXY({ x: 100, y: 100 })).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const legAnimations = useRef(
    Array(8).fill(0).map(() => new Animated.Value(0))
  ).current;
  
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  });

  // Track last position to calculate rotation
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height
      });
    };

    window.addEventListener('resize', updateDimensions);
    
    // Setup mouse move listener
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      
      // Calculate rotation based on movement direction
      if (lastPos.current.x !== 0) {
        const dx = clientX - lastPos.current.x;
        const dy = clientY - lastPos.current.y;
        
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          const angle = Math.atan2(dy, dx);
          Animated.timing(rotation, {
            toValue: angle,
            duration: 150,
            useNativeDriver: true
          }).start();
        }
      }
      
      // Update position with spring physics for natural movement
      Animated.spring(position, {
        toValue: { x: clientX, y: clientY },
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();
      
      lastPos.current = { x: clientX, y: clientY };
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Animate legs in a walking pattern
    const animateLegs = () => {
      // Create paired leg animations (opposite legs move together)
      const legPairs = [
        [0, 4], // Front and back
        [1, 5], // Front-side and back-side
        [2, 6], // Middle-front and middle-back
        [3, 7]  // Middle legs
      ];
      
      const animations = [];
      
      legPairs.forEach((pair, pairIndex) => {
        pair.forEach(legIndex => {
          // Create sequence for each leg
          animations.push(
            Animated.sequence([
              Animated.timing(legAnimations[legIndex], {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(legAnimations[legIndex], {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              })
            ])
          );
        });
      });
      
      // Stagger the leg pair animations
      Animated.stagger(100, animations).start(() => animateLegs());
    };

    animateLegs();

    return () => {
      window.removeEventListener('resize', updateDimensions);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const renderLeg = (index) => {
    // Calculate base angle for each leg around the body
    const baseAngles = [
      -15, -45, -90, -135, 165, 135, 90, 45
    ]; // Angles for each leg in degrees
    
    const baseAngleRad = (baseAngles[index] * Math.PI) / 180;
    
    // Leg segments lengths
    const femurLength = 18;
    const tibiaLength = 22;
    
    // Calculate joint positions
    const jointX = Math.cos(baseAngleRad) * femurLength;
    const jointY = Math.sin(baseAngleRad) * femurLength;
    
    // Animation for the leg movement
    const legBend = legAnimations[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0, index % 2 === 0 ? 15 : -15] // Alternate bending direction
    });

    // Rotate angles as degrees for transform
    const baseDegree = `${baseAngles[index]}deg`;
    
    return (
      <View key={index} style={[styles.legOrigin]}>
        {/* Femur (upper leg segment) */}
        <Animated.View
          style={[
            styles.femur,
            {
              transform: [
                { rotate: baseDegree },
                { translateX: femurLength / 2 },
              ],
            },
          ]}
        />
        
        {/* Joint between segments */}
        <Animated.View
          style={[
            styles.joint,
            {
              transform: [
                { translateX: jointX },
                { translateY: jointY },
              ],
            },
          ]}
        />
        
        {/* Tibia (lower leg segment) */}
        <Animated.View
          style={[
            styles.tibia,
            {
              transform: [
                { translateX: jointX },
                { translateY: jointY },
                { rotate: Animated.concat(baseDegree, ', ', legBend, 'deg') },
                { translateX: tibiaLength / 2 },
              ],
            },
          ]}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { width: dimensions.width, height: dimensions.height }]}>
      <Animated.View
        style={[
          styles.spider,
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate: rotation },
              { translateX: -15 }, // Center offset
              { translateY: -15 }, // Center offset
            ],
          },
        ]}
      >
        {/* Spider body parts */}
        <View style={styles.abdomen} />
        <View style={styles.cephalothorax} />
        
        {/* Spider legs */}
        <View style={styles.legsContainer}>
          {Array(8).fill(0).map((_, index) => renderLeg(index))}
        </View>
        
        {/* Spider eyes */}
        <View style={styles.eyeRow}>
          <View style={[styles.eye, styles.eyeSmall]} />
          <View style={[styles.eye, styles.eyeLarge]} />
          <View style={[styles.eye, styles.eyeLarge]} />
          <View style={[styles.eye, styles.eyeSmall]} />
        </View>
        <View style={[styles.eyeRow, { marginTop: 2 }]}>
          <View style={[styles.eye, styles.eyeLarge]} />
          <View style={[styles.eye, styles.eyeSmall]} />
          <View style={[styles.eye, styles.eyeSmall]} />
          <View style={[styles.eye, styles.eyeLarge]} />
        </View>
        
        {/* Spider fangs */}
        <View style={styles.fangsContainer}>
          <View style={[styles.fang, { transform: [{ rotate: '20deg' }]}]} />
          <View style={[styles.fang, { transform: [{ rotate: '-20deg' }]}]} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'transparent',
    pointerEvents: 'none', // Let mouse events pass through
    zIndex: 9999,
  },
  spider: {
    position: 'absolute',
    width: 30,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cephalothorax: {
    width: 14,
    height: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 7,
    position: 'absolute',
    top: 0,
  },
  abdomen: {
    width: 18,
    height: 24,
    backgroundColor: '#222',
    borderRadius: 9,
    position: 'absolute',
    top: 14,
    zIndex: 1,
  },
  legsContainer: {
    position: 'absolute',
    width: 30,
    height: 40,
    zIndex: 0,
  },
  legOrigin: {
    position: 'absolute',
    top: 8,
    left: 15,
    width: 1,
    height: 1,
  },
  femur: {
    position: 'absolute',
    width: 18,
    height: 2,
    backgroundColor: '#111',
    borderRadius: 1,
    transformOrigin: 'left center',
  },
  tibia: {
    position: 'absolute',
    width: 22,
    height: 1.5,
    backgroundColor: '#0a0a0a',
    borderRadius: 1,
    transformOrigin: 'left center',
  },
  joint: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#333',
    borderRadius: 1,
  },
  eyeRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: 3,
    left: 3,
    zIndex: 2,
  },
  eye: {
    backgroundColor: '#fff',
    borderRadius: 3,
    margin: 0.5,
  },
  eyeLarge: {
    width: 2.5,
    height: 2.5,
  },
  eyeSmall: {
    width: 2,
    height: 2,
  },
  fangsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 15,
    justifyContent: 'center',
    width: 14,
    zIndex: 2,
  },
  fang: {
    width: 2,
    height: 5,
    backgroundColor: '#222',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginHorizontal: 2,
  }
});

export default RealisticSpiderCursor;