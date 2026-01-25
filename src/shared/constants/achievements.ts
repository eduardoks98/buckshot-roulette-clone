// ==========================================
// ACHIEVEMENTS, BADGES & TITLES DEFINITIONS
// ==========================================

import { MilestoneDefinition, BadgeDefinition, TitleDefinition } from '../types/achievement.types';

// ==========================================
// ITEM BITMASK (for collector achievement)
// ==========================================

export const ITEM_BITMASK: Record<string, number> = {
  magnifying_glass: 1 << 0,
  beer:             1 << 1,
  cigarettes:       1 << 2,
  handcuffs:        1 << 3,
  hand_saw:         1 << 4,
  phone:            1 << 5,
  inverter:         1 << 6,
  adrenaline:       1 << 7,
  expired_medicine: 1 << 8,
  turn_reverser:    1 << 9,
};

export const ALL_ITEMS_BITMASK = (1 << 10) - 1; // 1023

// ==========================================
// MILESTONE ACHIEVEMENTS (25)
// ==========================================

export const MILESTONES: MilestoneDefinition[] = [
  // COMBAT (7)
  { id: 'first_blood', name: 'Primeiro Sangue', description: 'Consiga sua primeira eliminacao', icon: '\u{1F480}', category: 'combat' },
  { id: 'serial_killer', name: 'Serial Killer', description: 'Elimine 10 jogadores', icon: '\u{1FA93}', category: 'combat' },
  { id: 'centurion', name: 'Centuriao', description: 'Alcance 100 eliminacoes', icon: '\u{2694}\u{FE0F}', category: 'combat' },
  { id: 'angel_of_death', name: 'Anjo da Morte', description: 'Alcance 500 eliminacoes', icon: '\u{2620}\u{FE0F}', category: 'combat' },
  { id: 'demolisher', name: 'Demolidor', description: 'Cause 50 de dano total', icon: '\u{1F4A5}', category: 'combat' },
  { id: 'sniper', name: 'Atirador de Elite', description: 'Acerte 100 tiros com bala real', icon: '\u{1F3AF}', category: 'combat' },
  { id: 'saw_master', name: 'Mestre da Serra', description: 'Cause dano dobrado 20 vezes', icon: '\u{1FA9A}', category: 'combat' },

  // SURVIVAL (5)
  { id: 'survivor', name: 'Sobrevivente', description: 'Sobreviva a 10 rodadas', icon: '\u{1F6E1}\u{FE0F}', category: 'survival' },
  { id: 'iron_will', name: 'Vontade de Ferro', description: 'Sobreviva a 100 rodadas', icon: '\u{1F4AA}', category: 'survival' },
  { id: 'pharmacist', name: 'Farmaceutico', description: 'Sobreviva ao remedio vencido 10 vezes', icon: '\u{1F48A}', category: 'survival' },
  { id: 'pacifist', name: 'Pacifista', description: 'Venca uma rodada sem disparar nenhum tiro', icon: '\u{1F54A}\u{FE0F}', category: 'survival' },
  { id: 'last_stand', name: 'Ultima Chance', description: 'Venca com apenas 1 HP restante', icon: '\u{2764}\u{FE0F}\u{200D}\u{1F525}', category: 'survival' },

  // ITEMS (5)
  { id: 'collector', name: 'Colecionador', description: 'Use todos os 10 itens diferentes', icon: '\u{1F392}', category: 'items' },
  { id: 'item_hoarder', name: 'Acumulador', description: 'Use 100 itens no total', icon: '\u{1F4E6}', category: 'items' },
  { id: 'thief', name: 'Ladrao', description: 'Roube 10 itens com Adrenalina', icon: '\u{1F489}', category: 'items' },
  { id: 'chain_master', name: 'Mestre das Correntes', description: 'Algeme 20 jogadores', icon: '\u{26D3}\u{FE0F}', category: 'items' },
  { id: 'fortune_teller', name: 'Vidente', description: 'Use Lupa ou Celular 30 vezes', icon: '\u{1F52E}', category: 'items' },

  // GAMES (5)
  { id: 'rookie', name: 'Novato', description: 'Jogue sua primeira partida', icon: '\u{1F3AE}', category: 'games' },
  { id: 'veteran', name: 'Veterano', description: 'Jogue 100 partidas', icon: '\u{1F396}\u{FE0F}', category: 'games' },
  { id: 'champion', name: 'Campeao', description: 'Venca 10 partidas', icon: '\u{1F3C6}', category: 'games' },
  { id: 'unbeatable', name: 'Imbativel', description: 'Venca 10 partidas seguidas', icon: '\u{1F525}', category: 'games' },
  { id: 'dominator', name: 'Dominador', description: 'Venca todas as 3 rodadas em uma partida', icon: '\u{1F451}', category: 'games' },

  // SOCIAL (3)
  { id: 'social_butterfly', name: 'Borboleta Social', description: 'Jogue com 10 jogadores diferentes', icon: '\u{1F465}', category: 'social' },
  { id: 'full_house', name: 'Casa Cheia', description: 'Jogue uma partida com 4 jogadores', icon: '\u{1F340}', category: 'social' },
  { id: 'rival', name: 'Rival', description: 'Enfrente o mesmo jogador 5 vezes', icon: '\u{1F91D}', category: 'social' },
];

// ==========================================
// MATCH BADGES (20)
// ==========================================

export const BADGES: BadgeDefinition[] = [
  { id: 'badge_flawless', name: 'Impecavel', description: 'Vencer sem tomar dano', icon: '\u{2728}' },
  { id: 'badge_clutch', name: 'Na Racha', description: 'Vencer com 1 HP', icon: '\u{1F630}' },
  { id: 'badge_dominator', name: 'Dominador', description: '3+ kills no jogo', icon: '\u{1F479}' },
  { id: 'badge_berserker', name: 'Berserker', description: '10+ dano causado', icon: '\u{1F525}' },
  { id: 'badge_lucky', name: 'Sortudo', description: 'Sobreviver remedio vencido 2x', icon: '\u{1F340}' },
  { id: 'badge_pacifist', name: 'Pacifista', description: 'Vencer sem causar dano', icon: '\u{1F54A}\u{FE0F}' },
  { id: 'badge_sweep', name: 'Sweep', description: 'Vencer 3/3 rounds', icon: '\u{1F9F9}' },
  { id: 'badge_tank', name: 'Tanque', description: 'Tomar 8+ dano e nao ficar em ultimo', icon: '\u{1F6E1}\u{FE0F}' },
  { id: 'badge_kamikaze', name: 'Kamikaze', description: '3+ auto-dano', icon: '\u{1F4A3}' },
  { id: 'badge_marksman', name: 'Atirador', description: '100% tiros live (min 3)', icon: '\u{1F3AF}' },
  { id: 'badge_hoarder', name: 'Acumulador', description: '8+ itens usados', icon: '\u{1F4E6}' },
  { id: 'badge_tactician', name: 'Tatico', description: '4+ itens diferentes usados', icon: '\u{1F9E0}' },
  { id: 'badge_underdog', name: 'Zebra', description: 'Vencer com menor ELO', icon: '\u{1F434}' },
  { id: 'badge_comeback', name: 'Virada', description: 'Vencer perdendo rounds anteriores', icon: '\u{1F504}' },
  { id: 'badge_first_blood', name: 'Primeiro Sangue', description: 'Primeira kill do jogo', icon: '\u{1FA78}' },
  { id: 'badge_survivor', name: 'Sobrevivente', description: 'Ultimo vivo em 2+ rounds', icon: '\u{2764}\u{FE0F}\u{200D}\u{1FA79}' },
  { id: 'badge_thief', name: 'Ladrao', description: '3+ adrenalinas num jogo', icon: '\u{1F489}' },
  { id: 'badge_executioner', name: 'Executor', description: '2+ kills numa rodada', icon: '\u{26A1}' },
  { id: 'badge_no_items', name: 'Minimalista', description: 'Vencer rodada sem itens', icon: '\u{1F6AB}' },
  { id: 'badge_close_call', name: 'Por Um Fio', description: '1 HP por 3+ turnos', icon: '\u{1F631}' },
];

// ==========================================
// DYNAMIC TITLES (10)
// ==========================================

export const TITLES: TitleDefinition[] = [
  { id: 'title_exterminator', name: 'Exterminador', description: 'Mais kills este mes', icon: '\u{2620}\u{FE0F}', period: 'MONTHLY' },
  { id: 'title_tank', name: 'Tanque', description: 'Mais dano sofrido este mes', icon: '\u{1F6E1}\u{FE0F}', period: 'MONTHLY' },
  { id: 'title_lucky', name: 'Sortudo', description: 'Melhor win rate esta semana', icon: '\u{1F340}', period: 'WEEKLY' },
  { id: 'title_sharpshooter', name: 'Atirador', description: 'Melhor ratio dano/tiros esta semana', icon: '\u{1F3AF}', period: 'WEEKLY' },
  { id: 'title_strategist', name: 'Estrategista', description: 'Mais itens usados este mes', icon: '\u{1F9E0}', period: 'MONTHLY' },
  { id: 'title_iron_man', name: 'Homem de Ferro', description: 'Mais jogos esta semana', icon: '\u{1F4AA}', period: 'WEEKLY' },
  { id: 'title_rising_star', name: 'Estrela Ascendente', description: 'Maior ganho de ELO este mes', icon: '\u{2B50}', period: 'MONTHLY' },
  { id: 'title_perfectionist', name: 'Perfeccionista', description: 'Maior streak de vitorias ativa', icon: '\u{1F525}', period: 'ALL_TIME' },
  { id: 'title_veteran', name: 'Lenda', description: 'Mais partidas jogadas total', icon: '\u{1F396}\u{FE0F}', period: 'ALL_TIME' },
  { id: 'title_champion', name: 'Campeao Supremo', description: 'Maior ELO rating', icon: '\u{1F451}', period: 'ALL_TIME' },
];

// ==========================================
// HELPERS
// ==========================================

export function getMilestoneById(id: string): MilestoneDefinition | undefined {
  return MILESTONES.find(m => m.id === id);
}

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGES.find(b => b.id === id);
}

export function getTitleById(id: string): TitleDefinition | undefined {
  return TITLES.find(t => t.id === id);
}

export function getMilestonesByCategory(category: string): MilestoneDefinition[] {
  return MILESTONES.filter(m => m.category === category);
}

export function getItemBitmask(itemId: string): number {
  return ITEM_BITMASK[itemId] || 0;
}

export function hasAllItems(bitmask: number): boolean {
  return (bitmask & ALL_ITEMS_BITMASK) === ALL_ITEMS_BITMASK;
}
