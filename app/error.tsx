import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { logger } from '../utils/logger';

export default function GlobalError({ error, retry }: { error: Error; retry?: () => void }) {
  const router = useRouter();

  useEffect(() => {
    logger.error('Global error boundary caught error', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
  }, [error]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0D1421', padding: 24, justifyContent: 'center' }}>
      <Text style={{ color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 12 }}>
        Something went wrong
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20, marginBottom: 18 }}>
        Please try again. If it keeps happening, force-close the app and reopen.
      </Text>

      <Pressable
        onPress={() => (retry ? retry() : router.replace('/' as Href))}
        style={{
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignSelf: 'flex-start',
        }}
      >
        <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>Go Home</Text>
      </Pressable>
    </View>
  );
}
