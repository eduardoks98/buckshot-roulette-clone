// ==========================================
// HP DISPLAY COMPONENT
// ==========================================

import './HPDisplay.css';

interface HPDisplayProps {
  current: number;
  max: number;
  size?: 'sm' | 'md' | 'lg';
  showNumbers?: boolean;
}

export default function HPDisplay({
  current,
  max,
  size = 'md',
  showNumbers = false,
}: HPDisplayProps) {
  return (
    <div className={`hp-display hp-${size}`}>
      <div className="hp-hearts">
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={`hp-heart ${i < current ? 'full' : 'empty'}`}
          >
            {i < current ? '❤️' : '🖤'}
          </span>
        ))}
      </div>
      {showNumbers && (
        <span className="hp-numbers">
          {current}/{max}
        </span>
      )}
    </div>
  );
}
