import { Star } from 'lucide-react';
import { C } from '../../styles/tokens';

/** Estrellas de calificación */
export default function StarRating({ count = 5 }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${count} de 5 estrellas`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={16} fill={C.yellow} stroke="none" aria-hidden="true" />
      ))}
    </div>
  );
}
