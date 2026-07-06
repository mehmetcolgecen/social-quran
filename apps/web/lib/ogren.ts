// Kur'an okumayı öğrenme müfredatı — 10 adım, bol örnekli, tecvid dahil.
// Örnekler seçili Arapça fontla büyük gösterilir; latin karşılığı ve not eşlik eder.
export type Ornek = { ar: string; latin: string; not?: string };
export type Ders = {
  id: string; icon: string; title: string; intro: string;
  examples: Ornek[]; tip?: string;
};

export const DERSLER: Ders[] = [
  {
    id: 'harfler', icon: '🔤', title: 'Arap Alfabesi (28 harf)',
    intro: 'Kur\'an 28 harfle yazılır ve sağdan sola okunur. Önce harflerin tekil biçimlerini ve seslerini tanıyalım. Harfler kelime içinde başta/ortada/sonda biçim değiştirir ama sesi değişmez.',
    examples: [
      { ar: 'ا', latin: 'elif' }, { ar: 'ب', latin: 'be' }, { ar: 'ت', latin: 'te' }, { ar: 'ث', latin: 'se (peltek)' },
      { ar: 'ج', latin: 'cim' }, { ar: 'ح', latin: 'ha (boğaz)' }, { ar: 'خ', latin: 'hı (hırıltılı)' }, { ar: 'د', latin: 'dal' },
      { ar: 'ذ', latin: 'zel (peltek)' }, { ar: 'ر', latin: 'ra' }, { ar: 'ز', latin: 'ze' }, { ar: 'س', latin: 'sin' },
      { ar: 'ش', latin: 'şin' }, { ar: 'ص', latin: 'sad (kalın)' }, { ar: 'ض', latin: 'dad (kalın)' }, { ar: 'ط', latin: 'tı (kalın)' },
      { ar: 'ظ', latin: 'zı (kalın)' }, { ar: 'ع', latin: 'ayn (boğaz)' }, { ar: 'غ', latin: 'ğayn' }, { ar: 'ف', latin: 'fe' },
      { ar: 'ق', latin: 'kaf (kalın)' }, { ar: 'ك', latin: 'kef (ince)' }, { ar: 'ل', latin: 'lam' }, { ar: 'م', latin: 'mim' },
      { ar: 'ن', latin: 'nun' }, { ar: 'و', latin: 'vav' }, { ar: 'هـ', latin: 'he' }, { ar: 'ي', latin: 'ye' },
    ],
    tip: 'Kalın harfleri (ص ض ط ظ ق ve bazen ر ل) dolgun, ince harfleri yumuşak okuyun. Boğaz harflerini (ء هـ ع ح غ خ) mahreç modunda mor renkle görebilirsiniz.',
  },
  {
    id: 'harekeler', icon: '✏️', title: 'Harekeler: Üstün, Esre, Ötre',
    intro: 'Harekeler harfe ses veren küçük işaretlerdir. Üstün (fetha ــَ) "e/a", esre (kesra ــِ) "i", ötre (damme ــُ) "u/ü" sesi verir.',
    examples: [
      { ar: 'بَ', latin: 'be', not: 'üstün' }, { ar: 'بِ', latin: 'bi', not: 'esre' }, { ar: 'بُ', latin: 'bu', not: 'ötre' },
      { ar: 'دَ', latin: 'de' }, { ar: 'دِ', latin: 'di' }, { ar: 'دُ', latin: 'du' },
      { ar: 'خَلَقَ', latin: 'ha-le-ka', not: 'üç üstün art arda (96:1)' },
      { ar: 'كُتُبٌ', latin: 'ku-tu-bun', not: 'ötreler' },
      { ar: 'مَلِكِ', latin: 'me-li-ki', not: 'üstün + esreler (1:4)' },
    ],
    tip: 'Kalın harflerde üstün "a" okunur (خَ = ha), ince harflerde "e"ye yaklaşır (بَ = be).',
  },
  {
    id: 'cezm-sedde', icon: '⏸️', title: 'Cezm (Sükûn) ve Şedde',
    intro: 'Cezm (ــْ) harfi sessiz bırakır: harf kendinden önceki sese eklenir. Şedde (ــّ) harfi ikizleştirir: aynı harf önce sakin sonra harekeli okunur.',
    examples: [
      { ar: 'اَبْ', latin: 'eb', not: 'be sakin' }, { ar: 'اَمْ', latin: 'em' }, { ar: 'قُلْ', latin: 'kul', not: '(112:1)' },
      { ar: 'رَبِّ', latin: 'rab-bi', not: 'şeddeli be' },
      { ar: 'اِنَّ', latin: 'in-ne', not: 'şeddeli nun — ğunneli okunur' },
      { ar: 'اَلْحَمْدُ', latin: 'el-ham-du', not: 'lam ve mim sakin (1:2)' },
    ],
    tip: 'Şeddeli harfi tek harf gibi geçiştirmeyin; önce durur gibi basın, sonra hareke ile açın: rab-bi.',
  },
  {
    id: 'tenvin', icon: '〰️', title: 'Tenvin: Çift Harekeler',
    intro: 'Kelime sonundaki çift harekeler "n" sesi ekler: ــً "en/an", ــٍ "in", ــٌ "un".',
    examples: [
      { ar: 'كِتَابًا', latin: 'kitâben', not: 'iki üstün' },
      { ar: 'عَلِيمٌ', latin: 'alîmun', not: 'iki ötre (2:32)' },
      { ar: 'يَوْمَئِذٍ', latin: 'yevmeizin', not: 'iki esre (99:4)' },
      { ar: 'سَلَامٌ', latin: 'selâmun', not: '(97:5)' },
    ],
    tip: 'Tenvinin "n"si sonraki kelimeye göre değişebilir — bunu 8. derste (nun-i sakin halleri) göreceğiz.',
  },
  {
    id: 'med', icon: '📏', title: 'Uzatma (Med) Harfleri',
    intro: 'Elif (ا), sakin vav (و) ve sakin ye (ي) kendinden önceki sesi bir elif miktarı (yaklaşık bir parmak kaldırımı) uzatır: â, û, î.',
    examples: [
      { ar: 'بَا', latin: 'bâ' }, { ar: 'بِي', latin: 'bî' }, { ar: 'بُو', latin: 'bû' },
      { ar: 'قَالَ', latin: 'kâle', not: 'elif ile uzar' },
      { ar: 'قِيلَ', latin: 'kîle', not: 'ye ile uzar' },
      { ar: 'يَقُولُ', latin: 'yekûlu', not: 'vav ile uzar' },
      { ar: 'نُوحِيهَا', latin: 'nûhîhâ', not: 'üç uzatma bir arada (11:49)' },
    ],
    tip: 'Mahreç modunda med harfleri kırmızı (el-Cevf) görünür — sesin boğazdan dudağa serbestçe aktığı bölge.',
  },
  {
    id: 'elif-lam', icon: '🌙', title: 'Elif-Lâm Takısı: Şemsî ve Kamerî',
    intro: 'Arapçada belirlilik takısı ال\'dır. Kamerî harflerde lam okunur (el-kamer); şemsî harflerde lam yazılır ama okunmaz, sonraki harf şeddelenir (eş-şems).',
    examples: [
      { ar: 'اَلْقَمَرُ', latin: 'el-kameru', not: 'kamerî: lam okunur (54:1)' },
      { ar: 'اَلشَّمْسُ', latin: 'eş-şemsu', not: 'şemsî: lam okunmaz (91:1)' },
      { ar: 'اَلْحَمْدُ', latin: 'el-hamdu', not: 'kamerî (1:2)' },
      { ar: 'اَلرَّحْمَٰنُ', latin: 'er-rahmânu', not: 'şemsî (55:1)' },
      { ar: 'اَلنَّاسُ', latin: 'en-nâsu', not: 'şemsî (114:1)' },
    ],
    tip: 'Pratik kural: sonraki harfte şedde varsa lam okunmaz. Yazıdaki şedde size ipucu verir.',
  },
  {
    id: 'med-tecvid', icon: '🎵', title: 'Tecvid: Med Çeşitleri',
    intro: 'Uzatmanın üzerine hemze veya sükûn gelirse med uzar. Medd-i muttasıl (hemze aynı kelimede): 4 elif; medd-i munfasıl (hemze sonraki kelimede): 4 elife kadar; medd-i lâzım (sükûn ile): 4 elif.',
    examples: [
      { ar: 'جَاءَ', latin: 'câââe', not: 'muttasıl — aynı kelimede hemze (4 elif)' },
      { ar: 'اَلسَّمَاءِ', latin: 'es-semâââi', not: 'muttasıl (2:19)' },
      { ar: 'بِمَا أُنْزِلَ', latin: 'bimâ unzile', not: 'munfasıl — hemze sonraki kelimede (2:4)' },
      { ar: 'وَلَا الضَّالِّينَ', latin: 'veleddâââllîn', not: 'medd-i lâzım (1:7)' },
      { ar: 'الٓمٓ', latin: 'elif-lâââm-mîîîm', not: 'hurûf-u mukattaa — lâzım med (2:1)' },
    ],
    tip: 'Mushaflardaki med işareti (ٓ) size "burada uzat" der. Sesli dinlemede kâriyi takip ederek kulağınızı eğitin.',
  },
  {
    id: 'nun-sakin', icon: '🌀', title: 'Tecvid: Nun-i Sakin ve Tenvin Halleri',
    intro: 'Sakin nun (نْ) veya tenvinden sonra gelen harfe göre dört hal vardır: İzhar (boğaz harfinde açık okunur), İdgam (ي ر م ل و ن\'de katılır), İklab (ب\'de "m"ye döner), İhfa (kalan 15 harfte gizlenir/genizden).',
    examples: [
      { ar: 'مِنْ هَادٍ', latin: 'min hâdin', not: 'izhar — nun açık (13:33)' },
      { ar: 'مَنْ يَعْمَلْ', latin: 'mey-yağmel', not: 'idgam — nun ye\'ye katılır (4:123)' },
      { ar: 'مِنْ رَبِّهِمْ', latin: 'mir-rabbihim', not: 'idgam (2:5)' },
      { ar: 'مِنْ بَعْدِ', latin: 'mim-ba\'di', not: 'iklab — n → m (2:27)' },
      { ar: 'مِنْ قَبْلِكَ', latin: 'min(g) kablike', not: 'ihfa — genizden gizlenir (2:4)' },
      { ar: 'عَلِيمٌ حَكِيمٌ', latin: 'alîmun hakîm', not: 'tenvinde izhar (4:26)' },
    ],
    tip: 'Ezber kolaylığı: boğaz harfleri (ء ه ع ح غ خ) → izhar; يرملون harfleri → idgam; ب → iklab; gerisi → ihfa.',
  },
  {
    id: 'mim-gunne', icon: '🎶', title: 'Tecvid: Mim-i Sakin ve Ğunne',
    intro: 'Sakin mim (مْ) sonrası: م gelirse idgam-ı misleyn (ğunneli katma), ب gelirse ihfa-i şefevî (dudak gizlemesi), diğerlerinde izhar. Şeddeli نّ ve مّ her zaman ğunneli (genizden ~2 hareke) okunur.',
    examples: [
      { ar: 'لَهُمْ مَا', latin: 'lehum-mâ', not: 'idgam-ı misleyn (2:10)' },
      { ar: 'هُمْ بِهِ', latin: 'hum(b) bihî', not: 'ihfa-i şefevî' },
      { ar: 'عَلَيْهِمْ وَلَا', latin: 'aleyhim velâ', not: 'izhar (1:7)' },
      { ar: 'اِنَّ', latin: 'innnne', not: 'şeddeli nun ğunnesi' },
      { ar: 'ثُمَّ', latin: 'summmme', not: 'şeddeli mim ğunnesi (2:29)' },
    ],
    tip: 'Ğunne burnunuzdan gelen tınıdır — burnunuzu hafifçe tutup اِنَّ deyin; titreşimi hissetmelisiniz.',
  },
  {
    id: 'kalkale-vakif', icon: '🛑', title: 'Kalkale ve Durak (Vakıf) İşaretleri',
    intro: 'Kalkale harfleri (ق ط ب ج د) sakin olduğunda hafif bir seke/patlama ile okunur. Ayrıca ayet içindeki durak işaretleri nerede durup nerede geçeceğinizi söyler.',
    examples: [
      { ar: 'يَقْطَعُونَ', latin: 'yak(ı)tağûn', not: 'kaf kalkalesi (13:25)' },
      { ar: 'اَحَدْ', latin: 'ehad(ı)', not: 'vakıfta dal kalkalesi (112:1)' },
      { ar: 'قُلْ اَعُوذُ بِرَبِّ الْفَلَقْ', latin: '…felak(ı)', not: 'vakıfta kaf kalkalesi (113:1)' },
      { ar: 'مـ', latin: 'mim işareti', not: 'durmak gerekir (vakf-ı lâzım)' },
      { ar: 'لا', latin: 'lâ işareti', not: 'durma; durursan geriden al' },
      { ar: 'ج', latin: 'cim işareti', not: 'durmak da geçmek de olur' },
    ],
    tip: 'Kalkaleyi abartmayın: harfin sesi "ı" gibi tam bir hareke değil, kısa bir yaylanmadır.',
  },
  {
    id: 'pratik', icon: '🚀', title: 'Pratik: Fatiha ile Uygulama',
    intro: 'Öğrendiklerinizi Fatiha üzerinde uygulayın: kelimelere tıklayıp tek tek dinleyin, mahreç modunu açın, kâri ile birlikte tekrar edin. Her gün 10 dakika sesli takip, birkaç haftada akıcılık kazandırır.',
    examples: [
      { ar: 'بِسْمِ اللّٰهِ', latin: 'bismillâhi', not: 'esre + med' },
      { ar: 'اَلرَّحْمٰنِ الرَّحِيمِ', latin: 'er-rahmânir-rahîm', not: 'şemsî lam + medler' },
      { ar: 'اِيَّاكَ نَعْبُدُ', latin: 'iyyâke na\'budu', not: 'şedde + ayn (5. ayet)' },
      { ar: 'وَلَا الضَّالِّينَ', latin: 'veleddâllîn', not: 'medd-i lâzım ile bitiş' },
    ],
    tip: 'Sure sayfasında ▶ Dinle ile kâri eşliğinde okuyun; kelime takibi hangi kelimede olduğunuzu gösterir. Ezber listesiyle kelime dağarcığınızı büyütün.',
  },
];
