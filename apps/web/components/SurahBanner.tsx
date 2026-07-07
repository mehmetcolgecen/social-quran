// Sure unvan bantları — Selçuklu/Osmanlı tezyinatından 13 varyant (kullanıcı seçkisi:
// docs/inspiration + /unvan-taslaklari*.html taslaklarından 1,2,11,12,13,15,16,17,18
// + çınar/şafak/gece/dalga karışımları). Her sure ya ANAFİKRİNE uyan temalı bandı alır
// (TEMA tablosu; ör. Kamer→gece+hilal, Yûsuf→dokuma, İbrahim→çınar) ya da havuzdan
// kimliğine göre serpiştirilmiş bir deseni. Bantlar inline SVG'dir; pattern id'leri
// sure kimliğiyle öneklenir ki aynı sayfada birden çok bant çakışmasın.
import type { Surah } from '@/lib/types';

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const arNum = (n: number) => String(n).split('').map((d) => AR_DIGITS[Number(d)] ?? d).join('');

type Variant =
  | 'girih' | 'rumi' | 'zellij' | 'kayis' | 'kufi' | 'kundekari' | 'kanevice' | 'karatay' | 'mihrap'
  | 'cinar' | 'safak' | 'gece' | 'dalga';
type AmblemTip = 'hilal' | 'yildiz' | 'kandil';

// Temasız surelere çeşitlilik: kimliğe göre havuzdan dağıtım (serpiştirme)
const POOL: Variant[] = ['girih', 'rumi', 'zellij', 'kayis', 'kufi', 'kundekari', 'kanevice', 'karatay', 'mihrap'];

// Surenin anafikrine özgü bant + amblem eşlemesi
const TEMA: Record<number, { v: Variant; not: string; amblem?: AmblemTip }> = {
  1: { v: 'mihrap', not: 'Fâtiha — Kitabın kapısı: beş kat işçilik' },
  10: { v: 'dalga', not: 'Yûnus — deniz ve kurtuluş' },
  11: { v: 'dalga', not: 'Hûd — Nûh tufanı ve gemi' },
  12: { v: 'kanevice', not: 'Yûsuf — gömlek, dokuma' },
  14: { v: 'cinar', not: 'İbrâhîm — şecere-i tayyibe: kökü sabit, dalları gökte (14:24)' },
  18: { v: 'kufi', not: 'Kehf — mağaranın örgülü karanlığı' },
  19: { v: 'rumi', not: 'Meryem — saray tezhibinin zarafeti' },
  24: { v: 'kundekari', not: 'Nûr — ışık patlaması', amblem: 'kandil' },
  31: { v: 'cinar', not: 'Lokmân — hikmet ağacı (31:27)' },
  36: { v: 'rumi', not: 'Yâsîn — Kur’an’ın kalbi' },
  53: { v: 'gece', not: 'Necm — yıldıza yemin', amblem: 'yildiz' },
  54: { v: 'gece', not: 'Kamer — ayın yarılması', amblem: 'hilal' },
  55: { v: 'zellij', not: 'Rahmân — cennet bahçelerinin çok renkli mozaiği' },
  67: { v: 'kayis', not: 'Mülk — saltanatın yıldız geçmesi' },
  71: { v: 'dalga', not: 'Nûh — tufan' },
  76: { v: 'zellij', not: 'İnsan — cennet nimetleri' },
  85: { v: 'girih', not: 'Bürûc — burçlarla dolu gök', amblem: 'yildiz' },
  89: { v: 'safak', not: 'Fecr — şafağa yemin' },
  91: { v: 'safak', not: 'Şems — güneşe yemin' },
  92: { v: 'gece', not: 'Leyl — geceye yemin' },
  93: { v: 'safak', not: 'Duhâ — kuşluk ışığı' },
  95: { v: 'cinar', not: 'Tîn — incire ve zeytine yemin: ağaç' },
  97: { v: 'gece', not: 'Kadr — bin aydan hayırlı gece', amblem: 'yildiz' },
  106: { v: 'kanevice', not: 'Kureyş — kış ve yaz kervanları' },
  108: { v: 'dalga', not: 'Kevser — cennet ırmağı' },
  112: { v: 'karatay', not: 'İhlâs — tevhidin saf geometrisi' },
};

export function bannerVariant(surahId: number): Variant {
  return TEMA[surahId]?.v ?? POOL[surahId % POOL.length];
}

// ---- küçük amblemler: kartuşun iki yanında, surenin işareti ----
function Amblem({ tip, x }: { tip: AmblemTip; x: number }) {
  if (tip === 'hilal') {
    // Dolgun hilal: altın daireden, sağa kaydırılmış daire maske ile ısırık alınır
    const mid = `hl${x}`;
    return (
      <g>
        <mask id={mid}>
          <circle cx={x} cy="75" r="27" fill="#fff" />
          <circle cx={x + 13} cy="70" r="24" fill="#000" />
        </mask>
        <circle cx={x} cy="75" r="27" fill="#e8c95a" mask={`url(#${mid})`} stroke="none" />
      </g>
    );
  }
  if (tip === 'yildiz') {
    return (
      <g transform={`translate(${x} 75)`} stroke="#4a3808" strokeWidth="1.2">
        <rect x="-11" y="-11" width="22" height="22" fill="#e8c95a" />
        <rect x="-11" y="-11" width="22" height="22" fill="#e8c95a" transform="rotate(45)" />
        <circle r="4.4" fill="#c73a2a" />
      </g>
    );
  }
  // kandil
  return (
    <g transform={`translate(${x} 75)`} stroke="#4a3808" strokeWidth="1.4">
      <path d="M0 -40 V -22" fill="none" />
      <path d="M-9 -22 h18 l-3 7 h-12 Z" fill="#e8c95a" />
      <path d="M-13 -15 C -15 2 -8 13 0 13 C 8 13 15 2 13 -15 Z" fill="#e8c95a" />
      <path d="M0 -8 q 4.5 6 0 12 q -4.5 -6 0 -12 Z" fill="#c73a2a" stroke="none" />
      <path d="M-4 13 L0 20 L4 13" fill="#e8c95a" />
    </g>
  );
}

// ============ VARYANTLAR ============
// Her varyant: zemin + desen + kartuş çizer; yazı renklerini bildirir.
type Vdef = { ink: string; sub: string; render: (u: string) => React.ReactNode };

const V: Record<Variant, Vdef> = {
  // 1 — Selçuklu yıldız ağı
  girih: {
    ink: '#241f14', sub: '#6d5312',
    render: (u) => (
      <>
        <defs>
          <pattern id={`${u}p`} width="65" height="65" patternUnits="userSpaceOnUse">
            <rect width="65" height="65" fill="#1d4e79" />
            <g fill="none" stroke="#d9b545" strokeWidth="1.7">
              <path d="M32.5 6 L51 14 L59 32.5 L51 51 L32.5 59 L14 51 L6 32.5 L14 14 Z" />
              <path d="M32.5 14 L45.5 19.5 L51 32.5 L45.5 45.5 L32.5 51 L19.5 45.5 L14 32.5 L19.5 19.5 Z" opacity=".55" />
              <path d="M0 0 L14 14 M65 0 L51 14 M0 65 L14 51 M65 65 L51 51" opacity=".8" />
            </g>
            <circle cx="32.5" cy="32.5" r="3" fill="#e8c95a" />
            <circle cx="0" cy="0" r="2.2" fill="#7fb2d9" /><circle cx="65" cy="0" r="2.2" fill="#7fb2d9" />
            <circle cx="0" cy="65" r="2.2" fill="#7fb2d9" /><circle cx="65" cy="65" r="2.2" fill="#7fb2d9" />
          </pattern>
        </defs>
        <rect width="1400" height="150" fill="#c9a227" />
        <rect x="5" y="5" width="1390" height="140" fill="#7d5f0e" />
        <rect x="8" y="8" width="1384" height="134" fill={`url(#${u}p)`} />
        <rect x="8" y="8" width="1384" height="134" fill="none" stroke="#e8c95a" strokeWidth="2" />
        <path d="M 480 75 Q 520 26 700 26 Q 880 26 920 75 Q 880 124 700 124 Q 520 124 480 75 Z"
          fill="#fbf6e9" stroke="#7d5f0e" strokeWidth="3" />
        <path d="M 492 75 Q 528 34 700 34 Q 872 34 908 75 Q 872 116 700 116 Q 528 116 492 75 Z"
          fill="none" stroke="#c9a227" strokeWidth="1.6" />
        <path d="M 466 75 l 14 -14 l 14 14 l -14 14 Z M 906 75 l 14 -14 l 14 14 l -14 14 Z"
          fill="#c9a227" stroke="#7d5f0e" strokeWidth="2" />
      </>
    ),
  },
  // 2 — Osmanlı rumi helezonu
  rumi: {
    ink: '#241f14', sub: '#6d5312',
    render: (u) => (
      <>
        <defs>
          <g id={`${u}r`}>
            <path d="M0 0 C 40 -34 92 -30 118 -6 C 138 12 132 34 112 38 C 96 41 84 30 88 16 C 91 6 102 4 108 10"
              fill="none" stroke="#d9b545" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M0 0 C 40 34 92 30 118 6 C 138 -12 132 -34 112 -38 C 96 -41 84 -30 88 -16 C 91 -6 102 -4 108 -10"
              fill="none" stroke="#d9b545" strokeWidth="3.4" strokeLinecap="round" />
            <path d="M118 -6 q 26 -8 34 -28 q 4 22 -14 36 Z" fill="#e8c95a" />
            <path d="M118 6 q 26 8 34 28 q 4 -22 -14 -36 Z" fill="#e8c95a" />
            <path d="M52 -22 q 10 -16 26 -18 q -2 14 -16 22 Z" fill="#f3e7c0" opacity=".85" />
            <path d="M52 22 q 10 16 26 18 q -2 -14 -16 -22 Z" fill="#f3e7c0" opacity=".85" />
            <circle cx="160" cy="0" r="3.4" fill="#e8c95a" />
            <path d="M170 0 C 205 -30 250 -26 272 -4 C 288 12 280 30 264 32 C 252 34 244 24 248 14"
              fill="none" stroke="#d9b545" strokeWidth="3" strokeLinecap="round" opacity=".9" />
            <path d="M170 0 C 205 30 250 26 272 4 C 288 -12 280 -30 264 -32 C 252 -34 244 -24 248 -14"
              fill="none" stroke="#d9b545" strokeWidth="3" strokeLinecap="round" opacity=".9" />
            <path d="M272 -4 q 22 -6 30 -24 q 2 20 -12 32 Z" fill="#e8c95a" opacity=".95" />
            <path d="M272 4 q 22 6 30 24 q 2 -20 -12 -32 Z" fill="#e8c95a" opacity=".95" />
            <circle cx="318" cy="0" r="3" fill="#e8c95a" />
            <path d="M328 0 C 358 -24 396 -20 414 -2 C 426 10 420 24 407 26" fill="none" stroke="#d9b545" strokeWidth="2.7" strokeLinecap="round" opacity=".8" />
            <path d="M328 0 C 358 24 396 20 414 2 C 426 -10 420 -24 407 -26" fill="none" stroke="#d9b545" strokeWidth="2.7" strokeLinecap="round" opacity=".8" />
            <path d="M414 -2 q 18 -5 25 -20 q 2 17 -10 27 Z" fill="#e8c95a" opacity=".85" />
            <path d="M414 2 q 18 5 25 20 q 2 -17 -10 -27 Z" fill="#e8c95a" opacity=".85" />
          </g>
        </defs>
        <rect width="1400" height="150" fill="#c9a227" />
        <rect x="5" y="5" width="1390" height="140" fill="#16324f" />
        <rect x="10" y="10" width="1380" height="130" fill="none" stroke="#e8c95a" strokeWidth="1.6" />
        <g stroke="#e8c95a" strokeWidth="1" opacity=".65">
          <line x1="10" y1="20" x2="1390" y2="20" /><line x1="10" y1="130" x2="1390" y2="130" />
        </g>
        <use href={`#${u}r`} transform="translate(462 75) scale(-1 1)" />
        <use href={`#${u}r`} transform="translate(938 75)" />
        <path d="M 480 75 Q 515 28 700 28 Q 885 28 920 75 Q 885 122 700 122 Q 515 122 480 75 Z"
          fill="#fbf6e9" stroke="#c9a227" strokeWidth="3" />
        <path d="M 493 75 Q 524 36 700 36 Q 876 36 907 75 Q 876 114 700 114 Q 524 114 493 75 Z"
          fill="none" stroke="#8a6a1c" strokeWidth="1.2" />
        <path d="M 700 18 l 8 8 h -16 Z M 700 132 l 8 -8 h -16 Z" fill="#e8c95a" />
      </>
    ),
  },
  // 11 — zellij çini mozaiği
  zellij: {
    ink: '#1d1508', sub: '#8a2318',
    render: (u) => (
      <>
        <defs>
          <pattern id={`${u}p`} width="64" height="64" patternUnits="userSpaceOnUse">
            <rect width="64" height="64" fill="#efe4cb" />
            <g stroke="#33200a" strokeWidth="1">
              <path d="M0 0 L14 0 L0 14 Z" fill="#b3341f" /><path d="M64 0 L64 14 L50 0 Z" fill="#b3341f" />
              <path d="M0 64 L0 50 L14 64 Z" fill="#b3341f" /><path d="M64 64 L50 64 L64 50 Z" fill="#b3341f" />
              <path d="M32 22 L42 32 L32 42 L22 32 Z" fill="#123a8f" />
              <path d="M32 -10 L42 0 L32 10 L22 0 Z" fill="#0e8f96" /><path d="M32 54 L42 64 L32 74 L22 64 Z" fill="#0e8f96" />
              <path d="M-10 32 L0 22 L10 32 L0 42 Z" fill="#0e8f96" /><path d="M54 32 L64 22 L74 32 L64 42 Z" fill="#0e8f96" />
              <path d="M32 10 L38 16 L32 22 L26 16 Z" fill="#e8a020" /><path d="M32 42 L38 48 L32 54 L26 48 Z" fill="#e8a020" />
              <path d="M10 32 L16 26 L22 32 L16 38 Z" fill="#e8a020" /><path d="M42 32 L48 26 L54 32 L48 38 Z" fill="#e8a020" />
              <path d="M16 0 L26 0 L16 10 Z M48 0 L48 10 L38 0 Z M16 64 L16 54 L26 64 Z M48 64 L38 64 L48 54 Z" fill="#2c7a3f" />
              <path d="M0 16 L10 16 L0 26 Z M0 48 L0 38 L10 48 Z M64 16 L64 26 L54 16 Z M64 48 L54 48 L64 38 Z" fill="#2c7a3f" />
            </g>
            <circle cx="32" cy="32" r="3.2" fill="#efe4cb" stroke="#33200a" />
          </pattern>
        </defs>
        <rect width="1400" height="150" fill="#33200a" />
        <rect x="4" y="4" width="1392" height="142" fill="#c9a227" />
        <rect x="8" y="8" width="1384" height="134" fill={`url(#${u}p)`} />
        <rect x="8" y="8" width="1384" height="134" fill="none" stroke="#33200a" strokeWidth="2.4" />
        <path d="M 452 75 C 462 38 505 24 560 24 L 646 24 C 664 10 736 10 754 24 L 840 24 C 895 24 938 38 948 75
                 C 938 112 895 126 840 126 L 754 126 C 736 140 664 140 646 126 L 560 126 C 505 126 462 112 452 75 Z"
          fill="#123a8f" stroke="#33200a" strokeWidth="3" />
        <path d="M 466 75 C 476 44 512 32 562 32 L 650 32 C 668 20 732 20 750 32 L 838 32 C 888 32 924 44 934 75
                 C 924 106 888 118 838 118 L 750 118 C 732 130 668 130 650 118 L 562 118 C 512 118 476 106 466 75 Z"
          fill="#fdf8ea" stroke="#e8a020" strokeWidth="2.4" />
        <g fill="#b3341f" stroke="#33200a" strokeWidth="1.4">
          <path d="M 430 75 l 15 -13 l 15 13 l -15 13 Z" /><path d="M 940 75 l 15 -13 l 15 13 l -15 13 Z" />
        </g>
      </>
    ),
  },
  // 12 — girih kayışı (10 kollu yıldız)
  kayis: {
    ink: '#2a0a18', sub: '#8a2318',
    render: (u) => (
      <>
        <defs>
          <g id={`${u}s`}>
            <path d="M0 -34 L4.3 -13.3 L20 -27.5 L11.3 -8.2 L32.3 -10.5 L14 0 L32.3 10.5 L11.3 8.2 L20 27.5 L4.3 13.3
                     L0 34 L-4.3 13.3 L-20 27.5 L-11.3 8.2 L-32.3 10.5 L-14 0 L-32.3 -10.5 L-11.3 -8.2 L-20 -27.5 L-4.3 -13.3 Z"
              fill="#e8a020" stroke="#2a0a18" strokeWidth="2" />
            <circle r="8.5" fill="#12808a" stroke="#fdf3d8" strokeWidth="1.2" />
            <circle r="3" fill="#fdf3d8" />
          </g>
          <pattern id={`${u}p`} width="112" height="112" patternUnits="userSpaceOnUse">
            <rect width="112" height="112" fill="#4a0d28" />
            <g fill="none" stroke="#7a2545" strokeWidth="1.1">
              <path d="M0 28 H112 M0 84 H112 M28 0 V112 M84 0 V112" />
              <path d="M0 0 L112 112 M112 0 L0 112" />
            </g>
            <use href={`#${u}s`} x="56" y="56" />
            <g fill="#12808a" stroke="#2a0a18" strokeWidth="1.2">
              <path d="M0 0 L14 6 L6 14 Z" /><path d="M112 0 L106 14 L98 6 Z" />
              <path d="M0 112 L6 98 L14 106 Z" /><path d="M112 112 L98 106 L106 98 Z" />
            </g>
            <g fill="#c73a2a">
              <path d="M56 6 l5 6 -5 6 -5 -6 Z" /><path d="M56 94 l5 6 -5 6 -5 -6 Z" />
              <path d="M6 56 l6 -5 6 5 -6 5 Z" /><path d="M94 56 l6 -5 6 5 -6 5 Z" />
            </g>
          </pattern>
        </defs>
        <rect width="1400" height="150" fill="#2a0a18" />
        <rect x="4" y="4" width="1392" height="142" fill="#c9a227" />
        <rect x="8" y="8" width="1384" height="134" fill={`url(#${u}p)`} />
        <rect x="8" y="8" width="1384" height="134" fill="none" stroke="#e8a020" strokeWidth="1.8" />
        <path d="M 470 75 L 496 30 Q 700 12 904 30 L 930 75 L 904 120 Q 700 138 496 120 Z"
          fill="#12808a" stroke="#2a0a18" strokeWidth="3" />
        <path d="M 484 75 L 506 38 Q 700 22 894 38 L 916 75 L 894 112 Q 700 128 506 112 Z"
          fill="#fdf3d8" stroke="#e8a020" strokeWidth="2.2" />
        <g fill="#e8a020" stroke="#2a0a18" strokeWidth="1.4">
          <path d="M 444 75 l 13 -11 l 13 11 l -13 11 Z" /><path d="M 930 75 l 13 -11 l 13 11 l -13 11 Z" />
        </g>
      </>
    ),
  },
  // 13 — kûfi örgüsü
  kufi: {
    ink: '#241030', sub: '#8a2318',
    render: (u) => (
      <>
        <defs>
          <pattern id={`${u}p`} width="36" height="36" patternUnits="userSpaceOnUse">
            <rect width="36" height="36" fill="#2a1533" />
            <g fill="none" stroke="#16b3ac" strokeWidth="3">
              <path d="M-4 9 H22 V0 M13 9 V22 H40 M13 22 H0 M22 22 V36" />
            </g>
            <g fill="none" stroke="#e8a020" strokeWidth="3">
              <path d="M14 27 H40 V18 M31 27 V40 M31 40 H18 M-4 27 H4 V36" />
            </g>
            <circle cx="4.5" cy="31.5" r="1.6" fill="#f2e6c8" />
            <circle cx="31.5" cy="4.5" r="1.6" fill="#f2e6c8" />
          </pattern>
          <pattern id={`${u}e`} width="20" height="10" patternUnits="userSpaceOnUse">
            <rect width="20" height="10" fill="#16b3ac" />
            <path d="M0 10 L5 0 L10 10 Z" fill="#2a1533" />
            <path d="M10 10 L15 0 L20 10 Z" fill="#e8a020" />
          </pattern>
        </defs>
        <rect width="1400" height="150" fill="#180b1f" />
        <rect x="4" y="4" width="1392" height="142" fill="#c9a227" />
        <rect x="8" y="8" width="1384" height="10" fill={`url(#${u}e)`} />
        <rect x="8" y="132" width="1384" height="10" fill={`url(#${u}e)`} transform="rotate(180 700 137)" />
        <rect x="8" y="20" width="1384" height="110" fill={`url(#${u}p)`} />
        <rect x="8" y="20" width="1384" height="110" fill="none" stroke="#e8a020" strokeWidth="2" />
        <path d="M 468 75 L 500 30 H 640 L 656 20 H 744 L 760 30 H 900 L 932 75 L 900 120 H 760 L 744 130 H 656 L 640 120 H 500 Z"
          fill="#16b3ac" stroke="#180b1f" strokeWidth="3" />
        <path d="M 484 75 L 510 38 H 646 L 660 28 H 740 L 754 38 H 890 L 916 75 L 890 112 H 754 L 740 122 H 660 L 646 112 H 510 Z"
          fill="#f8f1dd" stroke="#c9a227" strokeWidth="2" />
      </>
    ),
  },
  // 15 — kündekâri patlaması
  kundekari: {
    ink: '#241207', sub: '#8a2318',
    render: (u) => (
      <>
        <defs>
          <g id={`${u}b`}>
            <g stroke="#f2e6c8" strokeWidth="1.3">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a, i) => (
                <path key={a} d="M0 0 L-9 -16 L0 -44 L9 -16 Z"
                  fill={['#e8a020', '#c73a2a', '#128f96'][i % 3]} transform={`rotate(${a})`} />
              ))}
            </g>
            <circle r="12" fill="#191014" stroke="#e8a020" strokeWidth="2" />
            <circle r="4.5" fill="#f2e6c8" />
          </g>
          <pattern id={`${u}p`} width="118" height="118" patternUnits="userSpaceOnUse">
            <rect width="118" height="118" fill="#191014" />
            <use href={`#${u}b`} x="59" y="59" />
            <g fill="#3d2c1a">
              <path d="M0 0 h20 l-20 20 Z M118 0 v20 l-20 -20 Z M0 118 v-20 l20 20 Z M118 118 h-20 l20 -20 Z" />
            </g>
            <g fill="#e8a020"><circle cx="0" cy="0" r="4" /><circle cx="118" cy="0" r="4" /><circle cx="0" cy="118" r="4" /><circle cx="118" cy="118" r="4" /></g>
            <g fill="#c73a2a"><circle cx="59" cy="0" r="2.6" /><circle cx="59" cy="118" r="2.6" /><circle cx="0" cy="59" r="2.6" /><circle cx="118" cy="59" r="2.6" /></g>
          </pattern>
        </defs>
        <rect width="1400" height="150" fill="#0d0a08" />
        <rect x="4" y="4" width="1392" height="142" fill="#c9a227" />
        <rect x="8" y="8" width="1384" height="134" fill={`url(#${u}p)`} />
        <rect x="8" y="8" width="1384" height="134" fill="none" stroke="#e8a020" strokeWidth="2" />
        <path d="M 460 75 L 486 34 L 540 24 L 700 20 L 860 24 L 914 34 L 940 75 L 914 116 L 860 126 L 700 130 L 540 126 L 486 116 Z"
          fill="#c73a2a" stroke="#0d0a08" strokeWidth="3" />
        <path d="M 476 75 L 498 42 L 546 33 L 700 29 L 854 33 L 902 42 L 924 75 L 902 108 L 854 117 L 700 121 L 546 117 L 498 108 Z"
          fill="#f8f1dd" stroke="#e8a020" strokeWidth="2.4" />
        <g fill="#128f96" stroke="#f2e6c8" strokeWidth="1.4">
          <circle cx="460" cy="75" r="7" /><circle cx="940" cy="75" r="7" />
        </g>
      </>
    ),
  },
  // 16 — kaneviçe / kilim yıldızı
  kanevice: {
    ink: '#2a1006', sub: '#a02818',
    render: (u) => (
      <>
        <defs>
          <pattern id={`${u}p`} width="76" height="76" patternUnits="userSpaceOnUse">
            <rect width="76" height="76" fill="#a02818" />
            <path d="M38 2 L74 38 L38 74 L2 38 Z" fill="#26356e" />
            <path d="M38 10 L66 38 L38 66 L10 38 Z" fill="#f2e6c8" />
            <path d="M38 18 L58 38 L38 58 L18 38 Z" fill="#d9a520" />
            <path d="M38 27 L49 38 L38 49 L27 38 Z" fill="#26356e" />
            <path d="M38 33 L43 38 L38 43 L33 38 Z" fill="#f2e6c8" />
            <g fill="#d9a520">
              <path d="M0 0 h8 v8 h-8 Z M68 0 h8 v8 h-8 Z M0 68 h8 v8 h-8 Z M68 68 h8 v8 h-8 Z" />
            </g>
            <g fill="#f2e6c8">
              <path d="M34 0 h8 v4 h-8 Z M34 72 h8 v4 h-8 Z M0 34 h4 v8 h-4 Z M72 34 h4 v8 h-4 Z" />
            </g>
            <g stroke="#7a1d10" strokeWidth=".8" opacity=".65">
              <path d="M0 19 H76 M0 38 H76 M0 57 H76 M19 0 V76 M38 0 V76 M57 0 V76" />
            </g>
          </pattern>
          <pattern id={`${u}e`} width="16" height="14" patternUnits="userSpaceOnUse">
            <rect width="16" height="14" fill="#26356e" />
            <path d="M8 1 L14 7 L8 13 L2 7 Z" fill="#d9a520" />
            <path d="M8 4 L11 7 L8 10 L5 7 Z" fill="#a02818" />
          </pattern>
        </defs>
        <rect width="1400" height="150" fill="#3d1008" />
        <rect x="4" y="4" width="1392" height="142" fill="#d9a520" />
        <rect x="8" y="8" width="1384" height="14" fill={`url(#${u}e)`} />
        <rect x="8" y="128" width="1384" height="14" fill={`url(#${u}e)`} />
        <rect x="8" y="22" width="1384" height="106" fill={`url(#${u}p)`} />
        <rect x="8" y="22" width="1384" height="106" fill="none" stroke="#f2e6c8" strokeWidth="2.4" />
        <path d="M 470 75 L 494 40 L 530 40 L 530 28 L 870 28 L 870 40 L 906 40 L 930 75 L 906 110 L 870 110 L 870 122 L 530 122 L 530 110 L 494 110 Z"
          fill="#26356e" stroke="#f2e6c8" strokeWidth="2.6" />
        <path d="M 486 75 L 506 46 L 540 46 L 540 36 L 860 36 L 860 46 L 894 46 L 914 75 L 894 104 L 860 104 L 860 114 L 540 114 L 540 104 L 506 104 Z"
          fill="#f7efd8" stroke="#d9a520" strokeWidth="2" />
        <g fill="#a02818"><path d="M 452 75 l 10 -9 l 10 9 l -10 9 Z" /><path d="M 928 75 l 10 -9 l 10 9 l -10 9 Z" /></g>
      </>
    ),
  },
  // 17 — Karatay firuze-siyah kayış geçmesi
  karatay: {
    ink: '#14100c', sub: '#0b6b66',
    render: (u) => (
      <>
        <defs>
          <g id={`${u}s`}>
            <g fill="none">
              <rect x="-19" y="-19" width="38" height="38" stroke="#16b3ac" strokeWidth="7" />
              <rect x="-19" y="-19" width="38" height="38" stroke="#0b6b66" strokeWidth="1.6" />
              <rect x="-24" y="-24" width="48" height="48" transform="rotate(45)" stroke="#e8a020" strokeWidth="6" />
              <rect x="-24" y="-24" width="48" height="48" transform="rotate(45)" stroke="#8a5f10" strokeWidth="1.4" />
            </g>
            <circle r="6" fill="#f2e6c8" />
            <circle r="2.2" fill="#14100c" />
          </g>
          <pattern id={`${u}p`} width="96" height="96" patternUnits="userSpaceOnUse">
            <rect width="96" height="96" fill="#14100c" />
            <use href={`#${u}s`} x="48" y="48" />
            <use href={`#${u}s`} x="0" y="0" /><use href={`#${u}s`} x="96" y="0" />
            <use href={`#${u}s`} x="0" y="96" /><use href={`#${u}s`} x="96" y="96" />
            <g fill="#c73a2a"><circle cx="48" cy="0" r="3" /><circle cx="48" cy="96" r="3" /><circle cx="0" cy="48" r="3" /><circle cx="96" cy="48" r="3" /></g>
          </pattern>
        </defs>
        <rect width="1400" height="150" fill="#0a0705" />
        <rect x="4" y="4" width="1392" height="142" fill="#16b3ac" />
        <rect x="8" y="8" width="1384" height="134" fill={`url(#${u}p)`} />
        <rect x="8" y="8" width="1384" height="134" fill="none" stroke="#e8a020" strokeWidth="2.2" />
        <path d="M 456 75 Q 470 26 540 22 L 660 18 L 700 6 L 740 18 L 860 22 Q 930 26 944 75 Q 930 124 860 128 L 740 132 L 700 144 L 660 132 L 540 128 Q 470 124 456 75 Z"
          fill="#e8a020" stroke="#0a0705" strokeWidth="3" />
        <path d="M 472 75 Q 484 34 546 30 L 664 26 L 700 16 L 736 26 L 854 30 Q 916 34 928 75 Q 916 116 854 120 L 736 124 L 700 134 L 664 124 L 546 120 Q 484 116 472 75 Z"
          fill="#fbf5e4" stroke="#16b3ac" strokeWidth="2.4" />
      </>
    ),
  },
  // 18 — mihrap şeridi (beş kat)
  mihrap: {
    ink: '#241207', sub: '#8a2318',
    render: (u) => (
      <>
        <defs>
          <pattern id={`${u}i`} width="16" height="10" patternUnits="userSpaceOnUse">
            <rect width="16" height="10" fill="#5e1408" />
            <circle cx="8" cy="5" r="3.4" fill="#f2e6c8" /><circle cx="8" cy="5" r="1.2" fill="#c73a2a" />
          </pattern>
          <pattern id={`${u}z`} width="22" height="12" patternUnits="userSpaceOnUse">
            <rect width="22" height="12" fill="#128f96" />
            <path d="M0 12 L5.5 0 L11 12 Z" fill="#e8a020" />
            <path d="M11 12 L16.5 0 L22 12 Z" fill="#26356e" />
          </pattern>
          <pattern id={`${u}f`} width="66" height="76" patternUnits="userSpaceOnUse">
            <rect width="66" height="76" fill="#173a8f" />
            <path d="M-6 62 Q 16 30 33 46 Q 50 30 72 62" fill="none" stroke="#e8a020" strokeWidth="3.4" />
            <path d="M33 46 C 25 32 27 20 33 12 C 39 20 41 32 33 46 Z" fill="#e8a020" stroke="#8a5f10" strokeWidth="1" />
            <path d="M33 42 C 28 32 29 24 33 18 C 37 24 38 32 33 42 Z" fill="#c73a2a" />
            <path d="M12 52 C 7 44 8 38 12 33 C 16 38 17 44 12 52 Z" fill="#16b3ac" />
            <path d="M54 52 C 49 44 50 38 54 33 C 58 38 59 44 54 52 Z" fill="#16b3ac" />
            <circle cx="33" cy="66" r="2.6" fill="#f2e6c8" />
            <circle cx="0" cy="8" r="2" fill="#f2e6c8" /><circle cx="66" cy="8" r="2" fill="#f2e6c8" />
          </pattern>
        </defs>
        <rect width="1400" height="150" fill="#3d0d05" />
        <rect x="4" y="4" width="1392" height="142" fill="#c9a227" />
        <rect x="8" y="8" width="1384" height="10" fill={`url(#${u}i)`} />
        <rect x="8" y="18" width="1384" height="12" fill={`url(#${u}z)`} />
        <rect x="8" y="30" width="1384" height="90" fill={`url(#${u}f)`} />
        <rect x="8" y="120" width="1384" height="12" fill={`url(#${u}z)`} transform="rotate(180 700 126)" />
        <rect x="8" y="132" width="1384" height="10" fill={`url(#${u}i)`} />
        <g fill="none" stroke="#f2e6c8" strokeWidth="1.6">
          <line x1="8" y1="30" x2="1392" y2="30" /><line x1="8" y1="120" x2="1392" y2="120" />
        </g>
        <path d="M 450 75 C 464 38 512 26 566 26 L 640 26 Q 656 12 700 12 Q 744 12 760 26 L 834 26 C 888 26 936 38 950 75
                 C 936 112 888 124 834 124 L 760 124 Q 744 138 700 138 Q 656 138 640 124 L 566 124 C 512 124 464 112 450 75 Z"
          fill="#c73a2a" stroke="#3d0d05" strokeWidth="3.4" />
        <path d="M 468 75 C 480 44 522 34 570 34 L 644 34 Q 660 20 700 20 Q 740 20 756 34 L 830 34 C 878 34 920 44 932 75
                 C 920 106 878 116 830 116 L 756 116 Q 740 130 700 130 Q 660 130 644 116 L 570 116 C 522 116 480 106 468 75 Z"
          fill="#fdf7e7" stroke="#e8a020" strokeWidth="2.6" />
        <g fill="#e8a020" stroke="#3d0d05" strokeWidth="1.4">
          <path d="M 426 75 l 14 -12 l 14 12 l -14 12 Z" /><path d="M 946 75 l 14 -12 l 14 12 l -14 12 Z" />
        </g>
      </>
    ),
  },
  // YENİ — çınar / hayat ağacı (kilim üslubu)
  cinar: {
    ink: '#14421f', sub: '#6e4a24',
    render: (u) => (
      <>
        <defs>
          <g id={`${u}t`}>
            <path d="M-4 34 L-2 -20 H2 L4 34 Z" fill="#6e4a24" />
            <path d="M-14 36 Q -6 28 0 34 Q 6 28 14 36 Z" fill="#6e4a24" />
            <g stroke="#14532d" strokeWidth="3.6" fill="none" strokeLinecap="round">
              <path d="M0 -20 V -46" />
              <path d="M0 -12 L -22 -26 M0 -12 L 22 -26" />
              <path d="M0 -26 L -17 -38 M0 -26 L 17 -38" />
              <path d="M0 -38 L -11 -47 M0 -38 L 11 -47" />
            </g>
            <g fill="#2c7a3f" stroke="#0d3d14" strokeWidth="1">
              <path d="M-22 -26 l -7 -8 l 9 -4 l 4 9 Z" /><path d="M22 -26 l 7 -8 l -9 -4 l -4 9 Z" />
              <path d="M-17 -38 l -6 -7 l 8 -4 l 4 8 Z" /><path d="M17 -38 l 6 -7 l -8 -4 l -4 8 Z" />
              <path d="M-11 -47 l -5 -6 l 7 -3 l 3 7 Z" /><path d="M11 -47 l 5 -6 l -7 -3 l -3 7 Z" />
            </g>
            <path d="M0 -46 l -5 -8 l 5 -6 l 5 6 Z" fill="#e8a020" stroke="#8a5f10" strokeWidth="1" />
            <g fill="#c73a2a">
              <circle cx="-22" cy="-26" r="2.4" /><circle cx="22" cy="-26" r="2.4" />
              <circle cx="-17" cy="-38" r="2" /><circle cx="17" cy="-38" r="2" />
            </g>
          </g>
          <pattern id={`${u}p`} width="140" height="104" patternUnits="userSpaceOnUse">
            <rect width="140" height="104" fill="#efe4c8" />
            <use href={`#${u}t`} x="70" y="62" />
            <g fill="#d9a520" stroke="#8a5f10" strokeWidth=".8">
              <path d="M0 52 l 8 -7 l 8 7 l -8 7 Z" transform="translate(-8 0)" />
              <path d="M132 52 l 8 -7 l 8 7 l -8 7 Z" />
            </g>
            <circle cx="35" cy="20" r="2.2" fill="#c73a2a" />
            <circle cx="105" cy="20" r="2.2" fill="#c73a2a" />
          </pattern>
          <pattern id={`${u}e`} width="18" height="12" patternUnits="userSpaceOnUse">
            <rect width="18" height="12" fill="#14532d" />
            <path d="M0 12 L4.5 2 L9 12 Z" fill="#d9a520" />
            <path d="M9 12 L13.5 2 L18 12 Z" fill="#efe4c8" />
          </pattern>
        </defs>
        <rect width="1400" height="150" fill="#0d3d14" />
        <rect x="4" y="4" width="1392" height="142" fill="#d9a520" />
        <rect x="8" y="8" width="1384" height="12" fill={`url(#${u}e)`} />
        <rect x="8" y="130" width="1384" height="12" fill={`url(#${u}e)`} transform="rotate(180 700 136)" />
        <rect x="8" y="20" width="1384" height="110" fill={`url(#${u}p)`} />
        <rect x="8" y="20" width="1384" height="110" fill="none" stroke="#14532d" strokeWidth="2.4" />
        <path d="M 470 75 Q 500 26 700 26 Q 900 26 930 75 Q 900 124 700 124 Q 500 124 470 75 Z"
          fill="#fdf8e8" stroke="#14532d" strokeWidth="3" />
        <path d="M 484 75 Q 512 34 700 34 Q 888 34 916 75 Q 888 116 700 116 Q 512 116 484 75 Z"
          fill="none" stroke="#d9a520" strokeWidth="2" />
        <g fill="#2c7a3f" stroke="#0d3d14" strokeWidth="1.2">
          <path d="M 446 75 q 10 -12 22 0 q -12 12 -22 0 Z" /><path d="M 954 75 q -10 -12 -22 0 q 12 12 22 0 Z" />
        </g>
      </>
    ),
  },
  // YENİ — şafak / güneş
  safak: {
    ink: '#3a0e15', sub: '#8a2318',
    render: (u) => (
      <>
        <defs>
          <linearGradient id={`${u}g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3b1240" />
            <stop offset=".55" stopColor="#8a2318" />
            <stop offset="1" stopColor="#d94f30" />
          </linearGradient>
          <radialGradient id={`${u}s`} cx=".5" cy="1" r="1">
            <stop offset="0" stopColor="#ffe9a8" />
            <stop offset=".4" stopColor="#e8a020" />
            <stop offset="1" stopColor="#e8a020" stopOpacity="0" />
          </radialGradient>
          <pattern id={`${u}z`} width="24" height="11" patternUnits="userSpaceOnUse">
            <rect width="24" height="11" fill="#3b1240" />
            <path d="M0 11 L6 0 L12 11 Z" fill="#e8a020" />
            <path d="M12 11 L18 0 L24 11 Z" fill="#c73a2a" />
          </pattern>
        </defs>
        <rect width="1400" height="150" fill="#2a0a18" />
        <rect x="4" y="4" width="1392" height="142" fill="#c9a227" />
        <rect x="8" y="8" width="1384" height="134" fill={`url(#${u}g)`} />
        <g fill="#e8a020" opacity=".5">
          {[-80, -60, -40, -20, 0, 20, 40, 60, 80].map((a) => (
            <path key={a} d="M700 146 L682 6 L718 6 Z" transform={`rotate(${a} 700 146)`} />
          ))}
        </g>
        <circle cx="700" cy="146" r="128" fill={`url(#${u}s)`} />
        <g fill="#f2e6c8" opacity=".9">
          <circle cx="80" cy="30" r="2" /><circle cx="180" cy="52" r="1.5" /><circle cx="300" cy="24" r="1.8" />
          <circle cx="1320" cy="30" r="2" /><circle cx="1220" cy="52" r="1.5" /><circle cx="1100" cy="24" r="1.8" />
        </g>
        <rect x="8" y="130" width="1384" height="12" fill={`url(#${u}z)`} />
        <rect x="8" y="8" width="1384" height="134" fill="none" stroke="#e8a020" strokeWidth="2" />
        <path d="M 486 75 Q 520 28 700 28 Q 880 28 914 75 Q 880 122 700 122 Q 520 122 486 75 Z"
          fill="#fdf3d8" stroke="#c73a2a" strokeWidth="3" />
        <path d="M 500 75 Q 532 36 700 36 Q 868 36 900 75 Q 868 114 700 114 Q 532 114 500 75 Z"
          fill="none" stroke="#e8a020" strokeWidth="1.8" />
        <g fill="#e8a020" stroke="#3a0e15" strokeWidth="1.3">
          <path d="M 458 75 l 13 -11 l 13 11 l -13 11 Z" /><path d="M 916 75 l 13 -11 l 13 11 l -13 11 Z" />
        </g>
      </>
    ),
  },
  // YENİ — gece / zerefşan + yıldızlar
  gece: {
    ink: '#10233f', sub: '#8a6a1c',
    render: (u) => (
      <>
        <defs>
          <pattern id={`${u}p`} width="90" height="70" patternUnits="userSpaceOnUse">
            <rect width="90" height="70" fill="#0b1a33" />
            <g fill="#e8c95a">
              <circle cx="12" cy="14" r="1.2" /><circle cx="34" cy="42" r="1" /><circle cx="58" cy="10" r="1.4" />
              <circle cx="80" cy="34" r="1" /><circle cx="22" cy="60" r="1.3" /><circle cx="66" cy="58" r="1" />
            </g>
            <path d="M46 22 l1.8 3.8 4 .6 -2.9 2.8 .7 4 -3.6 -1.9 -3.6 1.9 .7 -4 -2.9 -2.8 4 -.6 Z" fill="#f2e6c8" opacity=".9" />
          </pattern>
        </defs>
        <rect width="1400" height="150" fill="#060d1c" />
        <rect x="4" y="4" width="1392" height="142" fill="#c9a227" />
        <rect x="8" y="8" width="1384" height="134" fill={`url(#${u}p)`} />
        <rect x="14" y="14" width="1372" height="122" fill="none" stroke="#c9a227" strokeWidth="1.1" />
        <rect x="20" y="20" width="1360" height="110" fill="none" stroke="#e8c95a" strokeWidth="2.2" />
        <path d="M 210 45 A 33 33 0 1 0 210 105 A 26 26 0 1 1 210 45 Z" fill="#e8c95a" opacity=".95" />
        <path d="M 1190 45 A 33 33 0 1 1 1190 105 A 26 26 0 1 0 1190 45 Z" fill="#e8c95a" opacity=".95" />
        <g transform="translate(320 60)" fill="#f2e6c8">
          <rect x="-7" y="-7" width="14" height="14" /><rect x="-7" y="-7" width="14" height="14" transform="rotate(45)" />
        </g>
        <g transform="translate(1080 92)" fill="#f2e6c8">
          <rect x="-6" y="-6" width="12" height="12" /><rect x="-6" y="-6" width="12" height="12" transform="rotate(45)" />
        </g>
        <path d="M 508 75 Q 540 28 700 28 Q 860 28 892 75 Q 860 122 700 122 Q 540 122 508 75 Z"
          fill="#fbf6e9" stroke="#c9a227" strokeWidth="2.8" />
        <path d="M 522 75 Q 552 37 700 37 Q 848 37 878 75 Q 848 113 700 113 Q 552 113 522 75 Z"
          fill="none" stroke="#8a6a1c" strokeWidth="1.2" />
        <g fill="#e8c95a" stroke="#4a3808" strokeWidth="1.2">
          <g transform="translate(482 75)"><rect x="-9" y="-9" width="18" height="18" /><rect x="-9" y="-9" width="18" height="18" transform="rotate(45)" /></g>
          <g transform="translate(918 75)"><rect x="-9" y="-9" width="18" height="18" /><rect x="-9" y="-9" width="18" height="18" transform="rotate(45)" /></g>
        </g>
      </>
    ),
  },
  // YENİ — dalga / su yolu
  dalga: {
    ink: '#0d2b52', sub: '#0b6b66',
    render: (u) => (
      <>
        <defs>
          <pattern id={`${u}p`} width="72" height="48" patternUnits="userSpaceOnUse">
            <rect width="72" height="48" fill="#0f3d73" />
            <path d="M-6 38 C 8 14 28 12 38 26 C 45 36 37 44 30 39 C 25 35 29 29 34 31"
              fill="none" stroke="#16b3ac" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M30 38 C 44 14 64 12 74 26" fill="none" stroke="#7fd0d8" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="14" cy="12" r="1.8" fill="#f2e6c8" />
            <circle cx="56" cy="40" r="1.8" fill="#f2e6c8" />
          </pattern>
          <pattern id={`${u}e`} width="16" height="10" patternUnits="userSpaceOnUse">
            <rect width="16" height="10" fill="#0d2b52" />
            <circle cx="8" cy="5" r="3.2" fill="#f2e6c8" /><circle cx="8" cy="5" r="1.1" fill="#16b3ac" />
          </pattern>
        </defs>
        <rect width="1400" height="150" fill="#081d3a" />
        <rect x="4" y="4" width="1392" height="142" fill="#c9a227" />
        <rect x="8" y="8" width="1384" height="10" fill={`url(#${u}e)`} />
        <rect x="8" y="132" width="1384" height="10" fill={`url(#${u}e)`} />
        <rect x="8" y="18" width="1384" height="114" fill={`url(#${u}p)`} />
        <rect x="8" y="18" width="1384" height="114" fill="none" stroke="#7fd0d8" strokeWidth="2" />
        <path d="M 478 75 Q 512 26 700 26 Q 888 26 922 75 Q 888 124 700 124 Q 512 124 478 75 Z"
          fill="#f4fbf7" stroke="#0d2b52" strokeWidth="3" />
        <path d="M 492 75 Q 524 34 700 34 Q 876 34 908 75 Q 876 116 700 116 Q 524 116 492 75 Z"
          fill="none" stroke="#16b3ac" strokeWidth="2" />
        <g fill="#16b3ac" stroke="#f2e6c8" strokeWidth="1.4">
          <path d="M 450 75 q 10 -14 24 0 q -14 14 -24 0 Z" /><path d="M 950 75 q -10 -14 -24 0 q 14 14 24 0 Z" />
        </g>
      </>
    ),
  },
};

export default function SurahBanner({ surah, compact = false }: { surah: Surah; compact?: boolean }) {
  const tema = TEMA[surah.id];
  const variant = tema?.v ?? POOL[surah.id % POOL.length];
  const def = V[variant];
  const uid = `bnr${surah.id}`;
  const yer = surah.revelation_place === 'makkah' ? 'مَكِّيَّة' : 'مَدَنِيَّة';

  return (
    <div className={`sure-banner v-${variant}${compact ? ' compact' : ''}`} title={tema?.not}>
      <svg viewBox="0 0 1400 150" role="img" aria-label={`${surah.id}. ${surah.name_tr} Suresi`}>
        {def.render(uid)}
        {tema?.amblem && (
          <>
            <Amblem tip={tema.amblem} x={408} />
            <Amblem tip={tema.amblem} x={992} />
          </>
        )}
        <text className="bnr-ar" x={700} y={70} textAnchor="middle" fontSize={36} fill={def.ink} direction="rtl">
          {`سُورَةُ ${surah.name_arabic}`}
        </text>
        <text className="bnr-ar" x={700} y={103} textAnchor="middle" fontSize={16.5} fill={def.sub} direction="rtl">
          {`${yer} ۝ ${arNum(surah.verses_count)} آيَة`}
        </text>
      </svg>
    </div>
  );
}
