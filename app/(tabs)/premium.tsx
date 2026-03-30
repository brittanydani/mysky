import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import PremiumScreen from '../../components/PremiumScreen';

export default function PremiumTab() {
  const params = useLocalSearchParams<{
    source?: string | string[];
    experiment?: string | string[];
    variant?: string | string[];
  }>();

  const source = Array.isArray(params.source) ? params.source[0] : params.source;
  const experiment = Array.isArray(params.experiment) ? params.experiment[0] : params.experiment;
  const variant = Array.isArray(params.variant) ? params.variant[0] : params.variant;

  return <PremiumScreen analyticsSource={source} analyticsExperiment={experiment} analyticsVariant={variant} />;
}
