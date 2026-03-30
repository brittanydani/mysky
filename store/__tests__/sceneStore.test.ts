import { useSceneStore } from '../sceneStore';

describe('sceneStore', () => {
  beforeEach(() => {
    useSceneStore.setState({ activeScene: null });
  });

  it('starts with null activeScene', () => {
    expect(useSceneStore.getState().activeScene).toBeNull();
  });

  it('setActiveScene sets the scene', () => {
    useSceneStore.getState().setActiveScene('TODAY_WAVES');
    expect(useSceneStore.getState().activeScene).toBe('TODAY_WAVES');
  });

  it('clearScene resets to null', () => {
    useSceneStore.getState().setActiveScene('DREAM_MAP');
    useSceneStore.getState().clearScene();
    expect(useSceneStore.getState().activeScene).toBeNull();
  });

  it('setActiveScene replaces previous scene', () => {
    useSceneStore.getState().setActiveScene('CHECK_IN_SPHERE');
    useSceneStore.getState().setActiveScene('PATTERNS_ORBIT');
    expect(useSceneStore.getState().activeScene).toBe('PATTERNS_ORBIT');
  });
});
