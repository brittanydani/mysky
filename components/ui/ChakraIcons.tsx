// File: components/ui/ChakraIcons.tsx
// MySky — Chakra icons using @expo/vector-icons (MaterialCommunityIcons)
// Each chakra gets a meaningful icon in its own vibrant color

import React from 'react';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

type ChakraName = 'Root' | 'Sacral' | 'Solar Plexus' | 'Heart' | 'Throat' | 'Third Eye' | 'Crown';

/** Vibrant colors per chakra */
export const CHAKRA_ICON_COLORS: Record<ChakraName, string> = {
  Root:           '#E07A7A',
  Sacral:         '#E0A04A',
  'Solar Plexus': '#E0C35A',
  Heart:          '#6EBF8B',
  Throat:         '#5BB8D5',
  'Third Eye':    '#9B7AE0',
  Crown:          '#C89BF0',
};

/** Icon config per chakra: library + name — filled/solid variants */
const CHAKRA_ICONS: Record<ChakraName, { lib: 'mci' | 'ion'; name: string }> = {
  Root:           { lib: 'mci', name: 'triangle' },
  Sacral:         { lib: 'mci', name: 'water' },
  'Solar Plexus': { lib: 'mci', name: 'white-balance-sunny' },
  Heart:          { lib: 'mci', name: 'heart' },
  Throat:         { lib: 'mci', name: 'comment-text' },
  'Third Eye':    { lib: 'mci', name: 'eye' },
  Crown:          { lib: 'mci', name: 'crown' },
};

interface ChakraSvgIconProps {
  name: string;
  size?: number;
  color?: string;
  opacity?: number;
}

/** Render the right vector icon for a chakra by name.
 *  If no color is passed, uses the chakra's own vibrant color. */
export default function ChakraSvgIcon({ name, size = 20, color, opacity = 0.95 }: ChakraSvgIconProps) {
  const resolvedColor = color || CHAKRA_ICON_COLORS[name as ChakraName] || '#FFFFFF';
  const config = CHAKRA_ICONS[name as ChakraName];

  if (!config) {
    return (
      <MaterialCommunityIcons
        name="circle-outline"
        size={size}
        color={resolvedColor}
        style={{ opacity }}
      />
    );
  }

  if (config.lib === 'ion') {
    return (
      <Ionicons
        name={config.name as any}
        size={size}
        color={resolvedColor}
        style={{ opacity }}
      />
    );
  }

  return (
    <MaterialCommunityIcons
      name={config.name as any}
      size={size}
      color={resolvedColor}
      style={{ opacity }}
    />
  );
}
