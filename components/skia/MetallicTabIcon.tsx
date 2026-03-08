import React, { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';

const ACTIVE_ICON_COLOR = '#C9AE78';
const INACTIVE_ICON_COLOR = 'rgba(255, 255, 255, 0.70)';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  name: IoniconsName;
  focused: boolean;
  size?: number;
};

const MetallicTabIcon = memo(function MetallicTabIcon({ name, focused, size = 22 }: Props) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={focused ? ACTIVE_ICON_COLOR : INACTIVE_ICON_COLOR}
    />
  );
});

export default MetallicTabIcon;
