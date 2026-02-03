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
  { id: 'first_blood', name: 'Primeiro Sangue', description: 'Consiga sua primeira eliminacao', icon: 'skull', category: 'combat' },
  { id: 'serial_killer', name: 'Serial Killer', description: 'Elimine 10 jogadores', icon: 'axe', category: 'combat' },
  { id: 'centurion', name: 'Centuriao', description: 'Alcance 100 eliminacoes', icon: 'swords', category: 'combat' },
  { id: 'angel_of_death', name: 'Anjo da Morte', description: 'Alcance 500 eliminacoes', icon: 'skull', category: 'combat' },
  { id: 'demolisher', name: 'Demolidor', description: 'Cause 50 de dano total', icon: 'explosion', category: 'combat' },
  { id: 'sniper', name: 'Atirador de Elite', description: 'Acerte 100 tiros com bala real', icon: 'target', category: 'combat' },
  { id: 'saw_master', name: 'Mestre da Serra', description: 'Cause dano dobrado 20 vezes', icon: 'saw', category: 'combat' },

  // SURVIVAL (5)
  { id: 'survivor', name: 'Sobrevivente', description: 'Sobreviva a 10 rodadas', icon: 'shield', category: 'survival' },
  { id: 'iron_will', name: 'Vontade de Ferro', description: 'Sobreviva a 100 rodadas', icon: 'muscle', category: 'survival' },
  { id: 'pharmacist', name: 'Farmaceutico', description: 'Sobreviva ao remedio vencido 10 vezes', icon: 'medicine', category: 'survival' },
  { id: 'pacifist', name: 'Pacifista', description: 'Venca uma rodada sem disparar nenhum tiro', icon: 'dove', category: 'survival' },
  { id: 'last_stand', name: 'Ultima Chance', description: 'Venca com apenas 1 HP restante', icon: 'heart_fire', category: 'survival' },

  // ITEMS (5)
  { id: 'collector', name: 'Colecionador', description: 'Use todos os 10 itens diferentes', icon: 'backpack', category: 'items' },
  { id: 'item_hoarder', name: 'Acumulador', description: 'Use 100 itens no total', icon: 'package', category: 'items' },
  { id: 'thief', name: 'Ladrao', description: 'Roube 10 itens com Adrenalina', icon: 'adrenaline', category: 'items' },
  { id: 'chain_master', name: 'Mestre das Correntes', description: 'Algeme 20 jogadores', icon: 'chain', category: 'items' },
  { id: 'fortune_teller', name: 'Vidente', description: 'Use Lupa ou Celular 30 vezes', icon: 'crystal_ball', category: 'items' },

  // GAMES (5)
  { id: 'rookie', name: 'Novato', description: 'Jogue sua primeira partida', icon: 'gamepad', category: 'games' },
  { id: 'veteran', name: 'Veterano', description: 'Jogue 100 partidas', icon: 'medal', category: 'games' },
  { id: 'champion', name: 'Campeao', description: 'Venca 10 partidas', icon: 'trophy', category: 'games' },
  { id: 'unbeatable', name: 'Imbativel', description: 'Venca 10 partidas seguidas', icon: 'fire', category: 'games' },
  { id: 'dominator', name: 'Dominador', description: 'Venca todas as 3 rodadas em uma partida', icon: 'crown', category: 'games' },

  // SOCIAL (3)
  { id: 'social_butterfly', name: 'Borboleta Social', description: 'Jogue com 10 jogadores diferentes', icon: 'players', category: 'social' },
  { id: 'full_house', name: 'Casa Cheia', description: 'Jogue uma partida com 4 jogadores', icon: 'clover', category: 'social' },
  { id: 'rival', name: 'Rival', description: 'Enfrente o mesmo jogador 5 vezes', icon: 'handshake', category: 'social' },
];

// ==========================================
// MATCH BADGES (20)
// ==========================================

export const BADGES: BadgeDefinition[] = [
  { id: 'badge_flawless', name: 'Impecavel', description: 'Vencer sem tomar dano', icon: 'star' },
  { id: 'badge_clutch', name: 'Na Racha', description: 'Vencer com 1 HP', icon: 'heart_fire' },
  { id: 'badge_dominator', name: 'Dominador', description: '3+ kills no jogo', icon: 'crown' },
  { id: 'badge_berserker', name: 'Berserker', description: '10+ dano causado', icon: 'fire' },
  { id: 'badge_lucky', name: 'Sortudo', description: 'Sobreviver remedio vencido 2x', icon: 'clover' },
  { id: 'badge_pacifist', name: 'Pacifista', description: 'Vencer sem causar dano', icon: 'dove' },
  { id: 'badge_sweep', name: 'Sweep', description: 'Vencer 3/3 rounds', icon: 'trophy' },
  { id: 'badge_tank', name: 'Tanque', description: 'Tomar 8+ dano e nao ficar em ultimo', icon: 'shield' },
  { id: 'badge_kamikaze', name: 'Kamikaze', description: '3+ auto-dano', icon: 'explosion' },
  { id: 'badge_marksman', name: 'Atirador', description: '100% tiros live (min 3)', icon: 'target' },
  { id: 'badge_hoarder', name: 'Acumulador', description: '8+ itens usados', icon: 'package' },
  { id: 'badge_tactician', name: 'Tatico', description: '4+ itens diferentes usados', icon: 'backpack' },
  { id: 'badge_underdog', name: 'Zebra', description: 'Vencer com menor ELO', icon: 'star' },
  { id: 'badge_comeback', name: 'Virada', description: 'Vencer perdendo rounds anteriores', icon: 'fire' },
  { id: 'badge_first_blood', name: 'Primeiro Sangue', description: 'Primeira kill do jogo', icon: 'skull' },
  { id: 'badge_survivor', name: 'Sobrevivente', description: 'Ultimo vivo em 2+ rounds', icon: 'heart_fire' },
  { id: 'badge_thief', name: 'Ladrao', description: '3+ adrenalinas num jogo', icon: 'adrenaline' },
  { id: 'badge_executioner', name: 'Executor', description: '2+ kills numa rodada', icon: 'swords' },
  { id: 'badge_no_items', name: 'Minimalista', description: 'Vencer rodada sem itens', icon: 'target' },
  { id: 'badge_close_call', name: 'Por Um Fio', description: '1 HP por 3+ turnos', icon: 'heart_fire' },
];

// ==========================================
// DYNAMIC TITLES (10)
// ==========================================

export const TITLES: TitleDefinition[] = [
  { id: 'title_exterminator', name: 'Exterminador', description: 'Mais kills este mes', icon: 'skull', period: 'MONTHLY' },
  { id: 'title_tank', name: 'Tanque', description: 'Mais dano sofrido este mes', icon: 'shield', period: 'MONTHLY' },
  { id: 'title_lucky', name: 'Sortudo', description: 'Melhor win rate esta semana', icon: 'clover', period: 'WEEKLY' },
  { id: 'title_sharpshooter', name: 'Atirador', description: 'Melhor ratio dano/tiros esta semana', icon: 'target', period: 'WEEKLY' },
  { id: 'title_strategist', name: 'Estrategista', description: 'Mais itens usados este mes', icon: 'backpack', period: 'MONTHLY' },
  { id: 'title_iron_man', name: 'Homem de Ferro', description: 'Mais jogos esta semana', icon: 'muscle', period: 'WEEKLY' },
  { id: 'title_rising_star', name: 'Estrela Ascendente', description: 'Maior ganho de ELO este mes', icon: 'star', period: 'MONTHLY' },
  { id: 'title_perfectionist', name: 'Perfeccionista', description: 'Maior streak de vitorias ativa', icon: 'fire', period: 'ALL_TIME' },
  { id: 'title_veteran', name: 'Lenda', description: 'Mais partidas jogadas total', icon: 'medal', period: 'ALL_TIME' },
  { id: 'title_champion', name: 'Campeao Supremo', description: 'Maior ELO rating', icon: 'crown', period: 'ALL_TIME' },
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
