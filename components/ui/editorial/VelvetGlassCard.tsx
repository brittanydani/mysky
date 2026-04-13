import React, { useState } from 'react';
import { View, LayoutChangeEvent, StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { Canvas, RoundedRect, LinearGradient, vec } from '@shopify/react-native-skia';
import { Colors, Layout, Spacing } from './theme';

interface VelvetGlassCardProps extends ViewProps {
  children: React.ReactNode;
  /**
   * Controls the semantic background tint of the glass. 
   * Defaults to the neutral 'navy'.
   */
  tint?: 'navy' | 'sage' | 'coral';
}

export const VelvetGlassCard = ({ 
  children, 
  tint = 'navy', 
  style, 
  ...props 
}: VelvetGlassCardProps) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Dynamically capture the card's dimensions to feed to the Skia Canvas
  const onLayout = (event: LayoutChangeEvent) => {
    setDimensions({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  };

  // Map semantic tint to our theme hex, adding an alpha channel (E6 = ~90% opacity)
  const getBaseColor = () => {
    switch (tint) {
      case 'sage': return Colors.glassSage + 'E6'; 
      case 'coral': return Colors.glassCoral + 'E6';
      case 'navy':
      default: return Colors.glassNavy + 'E6';
    }
  };

  return (
    <View onLayout={onLayout} style={[styles.container, style]} {...props}>
      
      {/* Layer 1: The Native Glass Blur */}
      {/* expo-blur is highly optimized for scrolling lists, making it smoother than a Skia BackdropFilter here */}
      <BlurView 
        intensity={20} 
        tint="dark" 
        style={StyleSheet.absoluteFill} 
      />

      {/* Layer 2: The Velvet Tint & Light-Catching Border */}
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Canvas style={StyleSheet.absoluteFill}>
          {/* Base Velvet Tint */}
          <RoundedRect
            x={0}
            y={0}
            width={dimensions.width}
            height={dimensions.height}
            r={Layout.cardRadius}
            color={getBaseColor()}
          />
          
          {/* 1px Inner Gradient Border to catch the light on the top edge */}
          <RoundedRect
            x={1}
            y={1}
            width={dimensions.width - 2}
            height={dimensions.height - 2}
            r={Layout.cardRadius - 1}
            color="transparent"
            style="stroke"
            strokeWidth={1}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(dimensions.width, dimensions.height * 0.7)} // Fades out before hitting the bottom
              colors={[
                'rgba(214, 199, 180, 0.4)', // 40% Taupe at the top-left
                'rgba(214, 199, 180, 0.02)' // Fades to barely visible
              ]} 
            />
          </RoundedRect>
        </Canvas>
      )}

      {/* Layer 3: The Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: Layout.cardRadius,
    marginBottom: Spacing.xl, // Enforces the structural rhythm between cards
  },
  content: {
    padding: Spacing.lg, // Enforces the generous 24px breathing room
    position: 'relative',
    zIndex: 1,
  },
});
