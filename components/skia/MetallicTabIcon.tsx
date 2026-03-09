import React, { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';

import { SkiaGradient } from '../../components/ui/SkiaGradient';
import { metallicFillColors, metallicFillPositions } from '../../constants/mySkyMetallic';

const INACTIVE_ICON_COLOR = 'rgba(255, 255, 255, 0.70)';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  name: IoniconsName;
  focused: boolean;
  size?: number;
};

const MetallicTabIcon = memo(function MetallicTabIcon({ name, focused, size = 22 }: Props) {
  if (!focused) {
    return <Ionicons name={name} size={size} color={INACTIVE_ICON_COLOR} />;
  }

  return (
    <MaskedView
      style={{ width: size, height: size }}
      maskElement={<Ionicons name={name} size={size} color="#000" />}
    >
      <SkiaGradient
        colors={[...metallicFillColors]}
        locations={[...metallicFillPositions]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size, height: size }}
      />
    </MaskedView>
  );
});

export default MetallicTabIcon;
