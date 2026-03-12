import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSceneStore } from '@/store/sceneStore';
import { useDreamMapStore } from '@/store/dreamMapStore';

export default function DreamScreen() {
  const setActiveScene  = useSceneStore((s) => s.setActiveScene);
  const activeNode      = useDreamMapStore((s) => s.activeNode);
  const clearActiveNode = useDreamMapStore((s) => s.clearActiveNode);
  const data            = useDreamMapStore((s) => s.data);
  const isFetching      = useDreamMapStore((s) => s.isFetching);
  const error           = useDreamMapStore((s) => s.error);
  const hydrateFromCache = useDreamMapStore((s) => s.hydrateFromCache);
  const syncData        = useDreamMapStore((s) => s.syncData);

  useEffect(() => {
    hydrateFromCache();
    setActiveScene('DREAM_MAP');
    syncData();
    return () => {
      clearActiveNode();
    };
  }, [hydrateFromCache, setActiveScene, syncData, clearActiveNode]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header} pointerEvents="none">
        <Text style={styles.title}>Dream Topology</Text>
        <Text style={styles.subtitle}>Subconscious Clustering</Text>
        {isFetching ? (
          <Text style={styles.syncText}>Syncing latest dream patterns…</Text>
        ) : null}
      </View>

      <View style={styles.uiOverlay} pointerEvents="box-none">
        {activeNode ? (
          <View
            style={[
              styles.glassCard,
              { borderTopColor: activeNode.color },
            ]}
          >
            <Text style={[styles.nodeTitle, { color: activeNode.color }]}>
              {activeNode.label}
            </Text>
            <Text style={styles.nodeMeta}>
              Recurrence: {activeNode.recurrenceCount} recent dreams
            </Text>
            <Text style={styles.nodeDetail}>{activeNode.detail}</Text>
            {data?.lastSynced ? (
              <Text style={styles.metaText}>
                Last synced: {new Date(data.lastSynced).toLocaleString()}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.inlineInfo}>
            <Text style={styles.instructionText}>
              {error
                ? 'Unable to refresh dream patterns right now. Showing the most recent cached constellation.'
                : data?.nodes?.length
                ? 'Rotate the constellation and tap a symbol'
                : 'Add a few dream logs to generate your constellation'}
            </Text>
            {data?.lastSynced ? (
              <Text style={styles.metaTextCentered}>
                Last synced: {new Date(data.lastSynced).toLocaleString()}
              </Text>
            ) : null}
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 1,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.6,
  },
  syncText: {
    color: 'rgba(94,242,255,0.62)',
    fontSize: 12,
    marginTop: 6,
    letterSpacing: 0.4,
  },
  uiOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 42,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  inlineInfo: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  glassCard: {
    width: '100%',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 20,
    backgroundColor: 'rgba(16,18,34,0.84)',
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  nodeTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  nodeMeta: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  nodeDetail: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 14,
    lineHeight: 22,
  },
  metaText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginTop: 12,
  },
  metaTextCentered: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
});
