// ==========================================
// SHARED - INDEX
// ==========================================

export * from './types';
export * from './constants';
// Exportar gameUtils exceto ShellType e ShellInfo (já exportados por types)
export {
  getRandomInRange,
  shuffle,
  getRandomHP,
  generateShells,
  getShellCounts,
  getCurrentShell,
  calculateDamage,
  getItemCountPerReload,
  canReceiveMoreItems,
  rollExpiredMedicine,
  getRandomPhonePosition,
} from './utils/gameUtils';
export * from './services/itemProcessor';
export * from './utils/eloCalculator';
