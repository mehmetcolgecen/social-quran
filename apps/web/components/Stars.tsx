// Yıldız/ödül göstergesi — beğeni eşikleri: 1, 10, 50, 200, 1000 (apps/api/src/stars.ts ile eş)
export default function Stars({ stars, totalLikes }: { stars: number; totalLikes: number }) {
  return (
    <span className="stars" title={`${totalLikes} beğeni`}>
      <span className="stars-filled">{'★'.repeat(stars)}</span>
      <span className="stars-empty">{'☆'.repeat(5 - stars)}</span>
      <small> {totalLikes} beğeni</small>
    </span>
  );
}
