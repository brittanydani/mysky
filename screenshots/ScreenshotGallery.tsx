/**
 * ScreenshotGallery
 *
 * Preview gallery to view all 6 App Store screenshots on-device.
 * Horizontally scrollable with page indicators.
 *
 * Usage: Navigate to this screen during dev to preview/validate screenshots.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  StyleSheet,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import ScreenshotComposition from './ScreenshotComposition';
import { SCREENSHOTS } from './config';
import {
  MockDashboardScreen,
  MockMoodScreen,
  MockJournalScreen,
  MockSleepScreen,
  MockPatternsScreen,
  MockPersonalizeScreen,
} from './mocks';

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get('window');

// Map screenshot configs to their mock content components
function getMockContent(slug: string, width: number, height: number) {
  switch (slug) {
    case 'dashboard':
      return <MockDashboardScreen width={width} height={height} />;
    case 'mood':
      return <MockMoodScreen width={width} height={height} />;
    case 'journal':
      return <MockJournalScreen width={width} height={height} />;
    case 'sleep':
      return <MockSleepScreen width={width} height={height} />;
    case 'patterns':
      return <MockPatternsScreen width={width} height={height} />;
    case 'personalize':
      return <MockPersonalizeScreen width={width} height={height} />;
    default:
      return <View style={{ flex: 1, backgroundColor: '#0D1421' }} />;
  }
}

export default function ScreenshotGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / DEVICE_WIDTH);
    setActiveIndex(index);
  };

  // Scale factor: fit the full screenshot into the device screen
  const scale = DEVICE_WIDTH / 1290;
  // Phone screen dimensions inside the composition
  const phoneHeight = 2796 * scale * 0.67;
  const phoneWidth = phoneHeight * (1290 / 2796);
  const phoneScreenWidth = phoneWidth - 24; // minus bezel
  const phoneScreenHeight = phoneHeight - 24;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Title bar */}
      <View style={styles.titleBar}>
        <Text style={styles.titleText}>Screenshot Preview</Text>
        <Text style={styles.titleSub}>
          {activeIndex + 1} / {SCREENSHOTS.length} — {SCREENSHOTS[activeIndex]?.step}
        </Text>
      </View>

      {/* Paged horizontal scroll */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {SCREENSHOTS.map((config) => (
          <View key={config.id} style={[styles.page, { width: DEVICE_WIDTH }]}>
            <ScreenshotComposition config={config} previewScale={scale}>
              {getMockContent(config.slug, phoneScreenWidth, phoneScreenHeight)}
            </ScreenshotComposition>
          </View>
        ))}
      </ScrollView>

      {/* Page indicators */}
      <View style={styles.indicators}>
        {SCREENSHOTS.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              scrollRef.current?.scrollTo({ x: i * DEVICE_WIDTH, animated: true });
              setActiveIndex(i);
            }}
          >
            <View
              style={[
                styles.dot,
                i === activeIndex && styles.dotActive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Screenshot info */}
      <View style={styles.infoBar}>
        <Text style={styles.infoHeadline}>{SCREENSHOTS[activeIndex]?.headline.replace('\n', ' ')}</Text>
        <Text style={styles.infoPurpose}>{SCREENSHOTS[activeIndex]?.purpose}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  titleBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  titleText: {
    color: '#FDFBF7',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  titleSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: '#D8C39A',
    width: 20,
  },
  infoBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  infoHeadline: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '600',
  },
  infoPurpose: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
});
