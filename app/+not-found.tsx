import { Ionicons } from '@expo/vector-icons';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { router, Href } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

export default function NotFoundScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.background, theme.backgroundSecondary]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.content}>
        <Ionicons name="moon-outline" size={72} color={theme.primary} />
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.message}>
          The moment you&apos;re looking for seems to have been lost in the shadows.
        </Text>
        
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => router.push('/' as Href)}
        >
          <Text style={styles.homeButtonText}>Return Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  homeButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  homeButtonText: {
    color: theme.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
