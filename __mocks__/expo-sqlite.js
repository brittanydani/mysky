// Minimal stub for expo-sqlite in the Node test environment
module.exports = {
  openDatabaseSync: () => ({
    execSync: () => {},
    runSync: () => ({ changes: 0, lastInsertRowId: 0 }),
    getFirstSync: () => null,
    getAllSync: () => [],
    withTransactionSync: (fn) => fn(),
  }),
};
