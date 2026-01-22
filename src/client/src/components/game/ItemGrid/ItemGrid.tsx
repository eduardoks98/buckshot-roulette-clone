// ==========================================
// ITEM GRID COMPONENT
// ==========================================

import { Item } from '../../../../../shared/types';
import './ItemGrid.css';

interface ItemGridProps {
  items: Item[];
  selectedIndex?: number | null;
  onItemClick?: (index: number) => void;
  disabled?: boolean;
  maxItems?: number;
}

export default function ItemGrid({
  items,
  selectedIndex = null,
  onItemClick,
  disabled = false,
  maxItems = 7,
}: ItemGridProps) {
  const handleClick = (index: number) => {
    if (!disabled && onItemClick) {
      onItemClick(index);
    }
  };

  if (items.length === 0) {
    return (
      <div className="item-grid empty">
        <p className="no-items">Sem itens</p>
      </div>
    );
  }

  return (
    <div className="item-grid">
      {items.slice(0, maxItems).map((item, index) => (
        <button
          key={index}
          className={`item-slot ${selectedIndex === index ? 'selected' : ''}`}
          onClick={() => handleClick(index)}
          disabled={disabled}
          title={`${item.name}: ${item.description}`}
        >
          <span className="item-emoji">{item.emoji}</span>
        </button>
      ))}

      {/* Empty slots */}
      {Array.from({ length: Math.max(0, maxItems - items.length) }).map((_, i) => (
        <div key={`empty-${i}`} className="item-slot empty">
          <span className="empty-slot">-</span>
        </div>
      ))}
    </div>
  );
}
