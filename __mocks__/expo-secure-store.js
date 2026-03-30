// Minimal stub for expo-secure-store in the Node test environment
const store = new Map();

module.exports = {
  getItemAsync: async (key) => store.get(key) ?? null,
  setItemAsync: async (key, value) => { store.set(key, value); },
  deleteItemAsync: async (key) => { store.delete(key); },
};
