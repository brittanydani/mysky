import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { logger } from '../utils/logger';
import { useAppTheme } from '../context/ThemeContext';

export default function GlobalError({ error, retry }: { error: Error; retry?: () => void }) {
  const router = useRouter();
  const theme = useAppTheme();

  useEffect(() => {
    logger.error('Global error boundary caught error', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
  }, [error]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 24, justifyContent: 'center' }}>
      <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 12 }}>
        Something went wrong
      </Text>
      <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 18 }}>
        Please try again. If it keeps happening, force-close the app and reopen.
      </Text>

      <Pressable
        onPress={() => (retry ? retry() : router.replace('/' as Href))}
        style={{
          backgroundColor: 'transparent',
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignSelf: 'flex-start',
        }}
      >
        <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '600' }}>Go Home</Text>
      </Pressable>
    </View>
  );
}
