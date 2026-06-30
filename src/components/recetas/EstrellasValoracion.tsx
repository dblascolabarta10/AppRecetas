// src/components/recetas/EstrellasValoracion.tsx
import React from 'react';
import { Star } from 'lucide-react';

interface Props {
  rating: number;
  count?: number;
  showCount?: boolean;
}

export default function EstrellasValoracion({ rating, count = 0, showCount = true }: Props) {
  const notaLimpia = count === 0 && showCount ? 0.0 : (rating ? Number(rating) : 5.0);
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {[1, 2, 3, 4, 5].map((num) => {
        const fillPercent = Math.max(0, Math.min(100, (notaLimpia - (num - 1)) * 100));
        return (
          <div key={num} className="relative w-3 h-3 shrink-0">
            <Star className="w-3 h-3 text-stone-200 absolute top-0 left-0" />
            <div className="absolute top-0 left-0 h-full overflow-hidden" style={{ width: `${fillPercent}%` }}>
              <Star className="w-3 h-3 fill-amber-500 text-amber-500 absolute top-0 left-0 max-w-none" style={{ width: '12px', height: '12px' }} />
            </div>
          </div>
        );
      })}
      <span className="text-[9px] font-mono font-black text-amber-600 ml-1 bg-amber-50 px-1 rounded border border-amber-100 flex items-center gap-0.5">
        <span>{count === 0 && showCount ? "0.0" : notaLimpia.toFixed(1)}</span>
        {showCount && <span className="text-stone-400 font-sans font-bold text-[8px]">({count})</span>}
      </span>
    </div>
  );
}