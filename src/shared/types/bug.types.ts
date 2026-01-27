// ==========================================
// BUG REPORT TYPES
// ==========================================
// Tipos para bug reports (enviados ao Games Admin)
// ==========================================

export type BugCategory = 'GAMEPLAY' | 'UI' | 'CONNECTION' | 'PERFORMANCE' | 'OTHER';
export type BugPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const BUG_CATEGORIES: BugCategory[] = ['GAMEPLAY', 'UI', 'CONNECTION', 'PERFORMANCE', 'OTHER'];
export const BUG_PRIORITIES: BugPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const DEFAULT_PRIORITY: BugPriority = 'MEDIUM';

// Labels para exibição
export const CATEGORY_LABELS: Record<BugCategory, string> = {
  GAMEPLAY: 'Gameplay',
  UI: 'Interface',
  CONNECTION: 'Conexao',
  PERFORMANCE: 'Performance',
  OTHER: 'Outro',
};

export const PRIORITY_LABELS: Record<BugPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Critica',
};
