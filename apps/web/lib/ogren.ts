// Kur'an okumayı öğrenme müfredatı — 22 ders: harf aileleri, harekeler, işaretler,
// uzatmalar, okuma kuralları, tecvid ve Fatiha pratiği.
//
// Ses modeli (iki kaynak, karışmaz):
//  - `ses`  → /elifba/<ses>.mp3 — yapay zekâ (Microsoft neural, ar-SA) seslendirmesi.
//    Harf adları, heceler ve tek kelimeler için üretilir; `tts` alanı üretimde
//    okunacak metindir (yoksa `ar` okunur). Üretim: `npm run -w apps/web elifba-tts`.
//  - `ayet` → "sure:ayet" — Husary'nin TAM ayet tilaveti (kırpma yok). Tecvid
//    kuralları (ğunne, ihfa, kalkale, med…) yapay zekâ okuyuşunda bulunmadığından
//    tecvid dersleri gerçek tilavetle dinletilir.
export type Ornek = {
  ar: string;       // görüntülenen Arapça
  latin: string;    // Türkçe okunuş
  not?: string;     // kısa açıklama / kaynak
  ses?: string;     // yapay zekâ ses dosyası kimliği
  tts?: string;     // seslendirilecek metin (varsayılan: ar)
  ayet?: string;    // Husary tam ayet tilaveti ("1:1" gibi)
};
export type Harf = {
  ar: string;       // tekil biçim
  name: string;     // Türkçe adı (elif, be…)
  ses: string;      // harf adının ses kimliği
  tts: string;      // Arapça harf adı (seslendirme metni)
  formlar?: [string, string, string]; // başta / ortada / sonda
  not?: string;     // mahreç / özellik notu
  ornekler: Ornek[];
};
export type Ders = {
  id: string; icon: string; bolum: string; title: string; intro: string;
  harfler?: Harf[]; examples?: Ornek[]; tip?: string;
};

export const DERSLER: Ders[] = [
  // ---------------- BÖLÜM 1: HARFLER ----------------
  {
    id: 'harf-1', icon: '🔤', bolum: 'Harfler', title: 'Diş Ailesi: ا ب ت ث ن ي',
    intro: 'Kur\'an 28 harfle yazılır ve sağdan sola okunur. İlk ailemiz "diş" gövdeli harfler: aynı gövdeyi paylaşır, yalnızca nokta sayısı ve yeri değişir. Her kartta harfin adını, kelime içindeki üç biçimini ve iki örnek kelimeyi sesli dinleyebilirsiniz.',
    harfler: [
      { ar: 'ا', name: 'elif', ses: 'h-elif', tts: 'أَلِف', formlar: ['ا', 'ـا', 'ـا'], not: 'Kendinden sonraki harfe bağlanmaz; çoğu zaman uzatma görevi görür.',
        ornekler: [
          { ar: 'أَحَد', latin: 'ehad', not: 'bir, tek (112:1)', ses: 'k-ehad' },
          { ar: 'أَمَرَ', latin: 'emera', not: 'emretti', ses: 'k-emera' },
        ] },
      { ar: 'ب', name: 'be', ses: 'h-be', tts: 'بَاء', formlar: ['بـ', 'ـبـ', 'ـب'], not: 'Noktası altta ve tektir.',
        ornekler: [
          { ar: 'بَيْت', latin: 'beyt', not: 'ev (106:3)', ses: 'k-beyt' },
          { ar: 'بَحْر', latin: 'bahr', not: 'deniz', ses: 'k-bahr' },
        ] },
      { ar: 'ت', name: 'te', ses: 'h-te', tts: 'تَاء', formlar: ['تـ', 'ـتـ', 'ـت'], not: 'İki noktası üsttedir.',
        ornekler: [
          { ar: 'تِين', latin: 'tîn', not: 'incir (95:1)', ses: 'k-tin' },
          { ar: 'تَابَ', latin: 'tâbe', not: 'tevbe etti', ses: 'k-tabe' },
        ] },
      { ar: 'ث', name: 'se', ses: 'h-se', tts: 'ثَاء', formlar: ['ثـ', 'ـثـ', 'ـث'], not: 'Peltek "s": dil ucu dişlerin arasından çıkar.',
        ornekler: [
          { ar: 'ثُمَّ', latin: 'sümme', not: 'sonra', ses: 'k-summe' },
          { ar: 'ثَلَاثَة', latin: 'selâse', not: 'üç', ses: 'k-selase' },
        ] },
      { ar: 'ن', name: 'nun', ses: 'h-nun', tts: 'نُون', formlar: ['نـ', 'ـنـ', 'ـن'], not: 'Noktası üstte ve tektir; çanağı be ailesinden derindir.',
        ornekler: [
          { ar: 'نُور', latin: 'nûr', not: 'ışık (24:35)', ses: 'k-nur' },
          { ar: 'نَصْر', latin: 'nasr', not: 'yardım, zafer (110:1)', ses: 'k-nasr' },
        ] },
      { ar: 'ي', name: 'ye', ses: 'h-ye', tts: 'يَاء', formlar: ['يـ', 'ـيـ', 'ـي'], not: 'İki noktası alttadır; sonda kuyruğu kıvrılır.',
        ornekler: [
          { ar: 'يَوْم', latin: 'yevm', not: 'gün (1:4)', ses: 'k-yevm' },
          { ar: 'يَد', latin: 'yed', not: 'el', ses: 'k-yed' },
        ] },
    ],
    tip: 'Noktalar harfin kimliğidir: aynı gövdede alt tek nokta be, üst iki nokta te, üst üç nokta se okunur. Önce gövdeyi, sonra noktayı görün.',
  },
  {
    id: 'harf-2', icon: '✒️', bolum: 'Harfler', title: 'Çanaklar ve Çengeller: ج ح خ د ذ ر ز',
    intro: 'İkinci aile iki gruptan oluşur: çengel gövdeli ج ح خ üçlüsü ile bağlanmayan د ذ ر ز dörtlüsü. Bu dördü kendinden sonraki harfe bitişmez — kelimenin ortasında bile küçük bir boşluk bırakır.',
    harfler: [
      { ar: 'ج', name: 'cim', ses: 'h-cim', tts: 'جِيم', formlar: ['جـ', 'ـجـ', 'ـج'], not: 'Noktası çanağın içindedir.',
        ornekler: [
          { ar: 'جَنَّة', latin: 'cennet', not: 'cennet, bahçe (2:35)', ses: 'k-cennet' },
          { ar: 'جَبَل', latin: 'cebel', not: 'dağ', ses: 'k-cebel' },
        ] },
      { ar: 'ح', name: 'ha', ses: 'h-ha', tts: 'حَاء', formlar: ['حـ', 'ـحـ', 'ـح'], not: 'Boğazın ortasından, noktasız ve nefesli bir "h".',
        ornekler: [
          { ar: 'حَمْد', latin: 'hamd', not: 'övgü (1:2)', ses: 'k-hamd' },
          { ar: 'حَقّ', latin: 'hakk', not: 'gerçek, hak', ses: 'k-hakk' },
        ] },
      { ar: 'خ', name: 'hı', ses: 'h-hi', tts: 'خَاء', formlar: ['خـ', 'ـخـ', 'ـخ'], not: 'Hırıltılı "h": boğazın üst kısmından, gargara sesine yakın.',
        ornekler: [
          { ar: 'خَيْر', latin: 'hayr', not: 'iyilik (2:110)', ses: 'k-hayr' },
          { ar: 'خَلَقَ', latin: 'halaka', not: 'yarattı (96:1)', ses: 'k-halaka' },
        ] },
      { ar: 'د', name: 'dal', ses: 'h-dal', tts: 'دَال', formlar: ['د', 'ـد', 'ـد'], not: 'Sonraki harfe bağlanmaz.',
        ornekler: [
          { ar: 'دِين', latin: 'dîn', not: 'din (1:4)', ses: 'k-din' },
          { ar: 'دَار', latin: 'dâr', not: 'yurt, ev', ses: 'k-dar' },
        ] },
      { ar: 'ذ', name: 'zel', ses: 'h-zel', tts: 'ذَال', formlar: ['ذ', 'ـذ', 'ـذ'], not: 'Peltek "z": dil ucu dişlerin arasında. Sonraki harfe bağlanmaz.',
        ornekler: [
          { ar: 'ذِكْر', latin: 'zikr', not: 'anma (15:9)', ses: 'k-zikr' },
          { ar: 'ذَهَب', latin: 'zeheb', not: 'altın', ses: 'k-zeheb' },
        ] },
      { ar: 'ر', name: 'ra', ses: 'h-ra', tts: 'رَاء', formlar: ['ر', 'ـر', 'ـر'], not: 'Dil ucu titrer; üstün/ötre ile kalın, esre ile ince okunur. Bağlanmaz.',
        ornekler: [
          { ar: 'رَبّ', latin: 'rabb', not: 'Rab (1:2)', ses: 'k-rabb' },
          { ar: 'رَحْمَة', latin: 'rahme', not: 'rahmet (2:157)', ses: 'k-rahme' },
        ] },
      { ar: 'ز', name: 'ze', ses: 'h-ze', tts: 'زَاي', formlar: ['ز', 'ـز', 'ـز'], not: 'Türkçedeki "z" gibi; ra gövdesine üst nokta. Bağlanmaz.',
        ornekler: [
          { ar: 'زَيْتُون', latin: 'zeytûn', not: 'zeytin (95:1)', ses: 'k-zeytun' },
          { ar: 'زَكَاة', latin: 'zekât', not: 'zekât (2:43)', ses: 'k-zekat' },
        ] },
    ],
    tip: 'Bağlanmayan altı harfi ezberleyin: ا د ذ ر ز و. Bir kelimede bu harflerden sonra boşluk görürseniz kelime bitmemiştir — okumaya devam edin.',
  },
  {
    id: 'harf-3', icon: '🌊', bolum: 'Harfler', title: 'Dişliler ve Kalınlar: س ش ص ض ط ظ',
    intro: 'Üç dişli س ش ile dört kalın harf ص ض ط ظ. Kalın harfler ağzın arka kısmı kubbeleştirilerek dolgun okunur; yanlarındaki üstün "a", esre "ı"ya yakın tınlar. İnce-kalın farkı Kur\'an okuyuşunun rengidir.',
    harfler: [
      { ar: 'س', name: 'sin', ses: 'h-sin', tts: 'سِين', formlar: ['سـ', 'ـسـ', 'ـس'], not: 'İnce "s".',
        ornekler: [
          { ar: 'سَلَام', latin: 'selâm', not: 'esenlik (97:5)', ses: 'k-selam' },
          { ar: 'سَمَاء', latin: 'semâ', not: 'gök (2:19)', ses: 'k-sema' },
        ] },
      { ar: 'ش', name: 'şın', ses: 'h-sin2', tts: 'شِين', formlar: ['شـ', 'ـشـ', 'ـش'], not: 'Türkçedeki "ş"; sin gövdesine üç nokta.',
        ornekler: [
          { ar: 'شَمْس', latin: 'şems', not: 'güneş (91:1)', ses: 'k-sems' },
          { ar: 'شَهْر', latin: 'şehr', not: 'ay (takvim) (2:185)', ses: 'k-sehr' },
        ] },
      { ar: 'ص', name: 'sad', ses: 'h-sad', tts: 'صَاد', formlar: ['صـ', 'ـصـ', 'ـص'], not: 'Kalın "s": dolgun okunur, üstünü "a"ya çalar.',
        ornekler: [
          { ar: 'صَبْر', latin: 'sabr', not: 'sabır (2:153)', ses: 'k-sabr' },
          { ar: 'صَلَاة', latin: 'salât', not: 'namaz (2:3)', ses: 'k-salat' },
        ] },
      { ar: 'ض', name: 'dad', ses: 'h-dad', tts: 'ضَاد', formlar: ['ضـ', 'ـضـ', 'ـض'], not: 'Arapçaya özgü kalın "d": dilin yanı azı dişlere basılır.',
        ornekler: [
          { ar: 'ضُحَى', latin: 'duhâ', not: 'kuşluk vakti (93:1)', ses: 'k-duha' },
          { ar: 'ضَيْف', latin: 'dayf', not: 'misafir (51:24)', ses: 'k-dayf' },
        ] },
      { ar: 'ط', name: 'tı', ses: 'h-ti', tts: 'طَاء', formlar: ['طـ', 'ـطـ', 'ـط'], not: 'Kalın "t": dolgun ve tok.',
        ornekler: [
          { ar: 'طَيْر', latin: 'tayr', not: 'kuş (105:3)', ses: 'k-tayr' },
          { ar: 'طَعَام', latin: 'taâm', not: 'yemek (76:8)', ses: 'k-taam' },
        ] },
      { ar: 'ظ', name: 'zı', ses: 'h-zi', tts: 'ظَاء', formlar: ['ظـ', 'ـظـ', 'ـظ'], not: 'Kalın ve peltek "z": dil ucu dişler arasında, ağız dolgun.',
        ornekler: [
          { ar: 'ظِلّ', latin: 'zıll', not: 'gölge (4:57)', ses: 'k-zill' },
          { ar: 'ظُهْر', latin: 'zuhr', not: 'öğle', ses: 'k-zuhr' },
        ] },
    ],
    tip: 'Kalın harfleri (ص ض ط ظ ve ileride ق) söylerken ağzınızı "o" der gibi yuvarlayın; ince eşleriyle (س د ت ز ك) karşılaştırarak dinleyin: sin–sad, dal–dad, te–tı, ze–zı.',
  },
  {
    id: 'harf-4', icon: '🗣️', bolum: 'Harfler', title: 'Boğazdan Dudağa: ع غ ف ق ك ل م',
    intro: 'Boğaz harfleri ع غ, dudak-diş harfi ف, kalın ق, ince ك ve akıcı ل م. Ayn (ع) Türkçede karşılığı olmayan, boğazın ortası sıkılarak çıkan bir sestir — kulakla öğrenilir, bol bol dinleyin.',
    harfler: [
      { ar: 'ع', name: 'ayn', ses: 'h-ayn', tts: 'عَيْن', formlar: ['عـ', 'ـعـ', 'ـع'], not: 'Boğazın ortasından; "a" derken boğazı sıkın.',
        ornekler: [
          { ar: 'عِلْم', latin: 'ilm', not: 'bilgi (2:32)', ses: 'k-ilm' },
          { ar: 'عَبْد', latin: 'abd', not: 'kul (2:23)', ses: 'k-abd' },
        ] },
      { ar: 'غ', name: 'ğayn', ses: 'h-gayn', tts: 'غَيْن', formlar: ['غـ', 'ـغـ', 'ـغ'], not: 'Yumuşak gargara sesi; hı\'nın yumuşağı.',
        ornekler: [
          { ar: 'غَيْب', latin: 'ğayb', not: 'görünmeyen (2:3)', ses: 'k-gayb' },
          { ar: 'غَفُور', latin: 'ğafûr', not: 'çok bağışlayan (2:173)', ses: 'k-gafur' },
        ] },
      { ar: 'ف', name: 'fe', ses: 'h-fe', tts: 'فَاء', formlar: ['فـ', 'ـفـ', 'ـف'], not: 'Üst dişler alt dudağa değer; tek nokta üstte.',
        ornekler: [
          { ar: 'فَجْر', latin: 'fecr', not: 'tan vakti (89:1)', ses: 'k-fecr' },
          { ar: 'فِيل', latin: 'fîl', not: 'fil (105:1)', ses: 'k-fil' },
        ] },
      { ar: 'ق', name: 'kaf', ses: 'h-kaf', tts: 'قَاف', formlar: ['قـ', 'ـقـ', 'ـق'], not: 'Kalın "k": dilin kökü küçük dile değer. İki nokta üstte.',
        ornekler: [
          { ar: 'قَمَر', latin: 'kamer', not: 'ay (54:1)', ses: 'k-kamer' },
          { ar: 'قَلْب', latin: 'kalb', not: 'kalp (26:89)', ses: 'k-kalb' },
        ] },
      { ar: 'ك', name: 'kef', ses: 'h-kef', tts: 'كَاف', formlar: ['كـ', 'ـكـ', 'ـك'], not: 'İnce "k": Türkçedeki "ke" gibi.',
        ornekler: [
          { ar: 'كِتَاب', latin: 'kitâb', not: 'kitap (2:2)', ses: 'k-kitab' },
          { ar: 'كَرِيم', latin: 'kerîm', not: 'cömert, değerli (27:40)', ses: 'k-kerim' },
        ] },
      { ar: 'ل', name: 'lam', ses: 'h-lam', tts: 'لَام', formlar: ['لـ', 'ـلـ', 'ـل'], not: 'Türkçedeki "l"; yalnız Allah lafzında kalınlaşır.',
        ornekler: [
          { ar: 'لَيْل', latin: 'leyl', not: 'gece (92:1)', ses: 'k-leyl' },
          { ar: 'لِسَان', latin: 'lisân', not: 'dil (90:9)', ses: 'k-lisan' },
        ] },
      { ar: 'م', name: 'mim', ses: 'h-mim', tts: 'مِيم', formlar: ['مـ', 'ـمـ', 'ـم'], not: 'Dudaklar birleşir; yuvarlak baş, aşağı kuyruk.',
        ornekler: [
          { ar: 'مَلِك', latin: 'melik', not: 'hükümdar (114:2)', ses: 'k-melik' },
          { ar: 'مَاء', latin: 'mâ', not: 'su (2:22)', ses: 'k-ma' },
        ] },
    ],
    tip: 'Kaf (ق) ile kef (ك) farkını kelimelerle çalışın: kamer–kitâb, kalb–kerîm. İlki damaktan tok, ikincisi öne yakın ve incedir.',
  },
  {
    id: 'harf-5', icon: '⭐', bolum: 'Harfler', title: 'Son Harfler ve Özel İşaretler: و هـ ء ة لا',
    intro: 'Alfabeyi و ve هـ ile tamamlıyoruz; ardından üç özel işaret: hemze (ء) kesik bir nefes sesi, te merbuta (ة) yalnız kelime sonunda görülen "bağlı te", lam-elif (لا) ise lam ile elifin kaynaşmış yazımıdır.',
    harfler: [
      { ar: 'و', name: 'vav', ses: 'h-vav', tts: 'وَاو', formlar: ['و', 'ـو', 'ـو'], not: 'Dudaklar yuvarlanır; sonraki harfe bağlanmaz.',
        ornekler: [
          { ar: 'وَجْه', latin: 'vech', not: 'yüz (2:112)', ses: 'k-vech' },
          { ar: 'وَعْد', latin: 'va’d', not: 'söz (4:122)', ses: 'k-vad' },
        ] },
      { ar: 'هـ', name: 'he', ses: 'h-he', tts: 'هَاء', formlar: ['هـ', 'ـهـ', 'ـه'], not: 'Yumuşak "h": boğazın en dibinden, nefes gibi.',
        ornekler: [
          { ar: 'هُدًى', latin: 'hüdâ', not: 'hidayet (2:2)', ses: 'k-huda' },
          { ar: 'هُوَ', latin: 'hüve', not: 'o (112:1)', ses: 'k-huve' },
        ] },
      { ar: 'ء', name: 'hemze', ses: 'h-hemze', tts: 'هَمْزَة', not: 'Kesik nefes sesi ("uh-oh" arasındaki durak). Tek başına ya da أ إ ئ ؤ taşıyıcıları üzerinde yazılır.',
        ornekler: [
          { ar: 'سَأَلَ', latin: 'seele', not: 'sordu (70:1)', ses: 'k-seele' },
          { ar: 'شَيْء', latin: 'şey’', not: 'şey (2:20)', ses: 'k-sey' },
        ] },
      { ar: 'ة', name: 'te merbuta', ses: 'h-temerbuta', tts: 'تَاء مَرْبُوطَة', not: 'Yalnız kelime sonunda: ة / ـة. Durulunca "he" gibi, geçilince "te" gibi okunur.',
        ornekler: [
          { ar: 'سُورَة', latin: 'sûre', not: 'sure (2:23)', ses: 'k-sure' },
          { ar: 'قَرْيَة', latin: 'karye', not: 'şehir, belde (36:13)', ses: 'k-karye' },
        ] },
      { ar: 'لا', name: 'lam-elif', ses: 'h-lamelif', tts: 'لَام أَلِف', not: 'Lam + elifin bitişik yazımı; "lâ" okunur.',
        ornekler: [
          { ar: 'لَا', latin: 'lâ', not: 'hayır, yok', ses: 'k-la' },
          { ar: 'لَا إِلَٰهَ إِلَّا اللَّهُ', latin: 'lâ ilâhe illallâh', not: 'kelime-i tevhid (47:19)', ses: 'k-tevhid' },
        ] },
    ],
    tip: 'Tebrikler — 28 harfin tamamını gördünüz! Sonraki derste harflerin kelime içinde nasıl el ele tutuştuğuna bakacağız.',
  },
  {
    id: 'harf-bicim', icon: '🔗', bolum: 'Harfler', title: 'Harflerin Bitişmesi',
    intro: 'Arap yazısı bitişiktir: çoğu harf başta, ortada ve sonda biçim değiştirir ama SESİ değişmez. Gövdeyi tanıyan göz, biçim değişse de harfi tanır. Aşağıdaki kelimelerde aynı harfleri farklı konumlarda izleyin ve dinleyin.',
    examples: [
      { ar: 'كَتَبَ', latin: 'ke-te-be', not: 'yazdı — kef başta, te ortada, be sonda (2:187)', ses: 'k-ketebe' },
      { ar: 'بَيْت', latin: 'beyt', not: 'be başta', ses: 'k-beyt' },
      { ar: 'صَبْر', latin: 'sabr', not: 'be ortada', ses: 'k-sabr' },
      { ar: 'قَرِيب', latin: 'karîb', not: 'be sonda — yakın (2:186)', ses: 'k-karib' },
      { ar: 'مَلِك', latin: 'melik', not: 'mim başta', ses: 'k-melik' },
      { ar: 'حَمْد', latin: 'hamd', not: 'mim ortada', ses: 'k-hamd' },
      { ar: 'قَلَم', latin: 'kalem', not: 'mim sonda (68:1)', ses: 'k-kalem' },
      { ar: 'نُور', latin: 'nûr', not: 'nun başta', ses: 'k-nur' },
      { ar: 'عِنْد', latin: 'inde', not: 'nun ortada — katında (2:54)', ses: 'k-inde' },
      { ar: 'دِين', latin: 'dîn', not: 'nun sonda', ses: 'k-din' },
      { ar: 'دَار', latin: 'dâr', not: 'dal ve elif bağlanmaz: harfler ayrık kalır', ses: 'k-dar' },
      { ar: 'وَرَقَة', latin: 'varaka', not: 'yaprak — vav ve ra bağlanmaz (6:59)', ses: 'k-varaka' },
    ],
    tip: 'Bağlanmayan altı harf ا د ذ ر ز و kelime içinde boşluk bırakır; bu boşluk kelime sonu DEĞİLDİR. Kelime sınırlarını harekeler ve anlamla birlikte kavrayacaksınız.',
  },

  // ---------------- BÖLÜM 2: HAREKELER ----------------
  {
    id: 'ustun', icon: '🔼', bolum: 'Harekeler', title: 'Üstün (Fetha): "e / a" Sesi',
    intro: 'Harekeler harfe ses veren küçük işaretlerdir. Üstün, harfin ÜSTÜNE çizilen eğik çizgidir (ــَ) ve harfi "e" (ince harflerde) ya da "a" (kalın harflerde) sesiyle okutur. Önce heceleri, sonra kelimeleri dinleyip tekrar edin.',
    examples: [
      { ar: 'بَ', latin: 'be', ses: 's-be-e' },
      { ar: 'تَ', latin: 'te', ses: 's-te-e' },
      { ar: 'ثَ', latin: 'se', ses: 's-se-e' },
      { ar: 'جَ', latin: 'ce', ses: 's-cim-e' },
      { ar: 'حَ', latin: 'ha', ses: 's-ha-e' },
      { ar: 'خَ', latin: 'ha (hırıltılı)', ses: 's-hi-e' },
      { ar: 'دَ', latin: 'de', ses: 's-dal-e' },
      { ar: 'رَ', latin: 'ra', ses: 's-ra-e' },
      { ar: 'سَ', latin: 'se (ince)', ses: 's-sin-e' },
      { ar: 'صَ', latin: 'sa (kalın)', ses: 's-sad-e' },
      { ar: 'عَ', latin: 'a (boğazdan)', ses: 's-ayn-e' },
      { ar: 'قَ', latin: 'ka (kalın)', ses: 's-kaf-e' },
      { ar: 'خَلَقَ', latin: 'ha-la-ka', not: 'yarattı (96:1)', ses: 'k-halaka' },
      { ar: 'كَتَبَ', latin: 'ke-te-be', not: 'yazdı', ses: 'k-ketebe' },
      { ar: 'جَعَلَ', latin: 'ce-a-le', not: 'kıldı, yaptı (2:22)', ses: 'k-ceale' },
      { ar: 'ذَهَبَ', latin: 'ze-he-be', not: 'gitti (2:17)', ses: 'k-zehebe' },
      { ar: 'نَصَرَ', latin: 'na-sa-ra', not: 'yardım etti (9:40)', ses: 'k-nasara' },
      { ar: 'صَدَقَ', latin: 'sa-da-ka', not: 'doğru söyledi (3:95)', ses: 'k-sadaka' },
    ],
    tip: 'İnce harfte "e" (be, te, se), kalın harfte "a" (sa, ta, ka) duyacaksınız. Aynı işaret, rengi harf belirliyor — kulağınız bu farkı birkaç dinlemede yakalar.',
  },
  {
    id: 'esre', icon: '🔽', bolum: 'Harekeler', title: 'Esre (Kesra): "i" Sesi',
    intro: 'Esre, harfin ALTINA çizilen eğik çizgidir (ــِ) ve harfi "i" sesiyle okutur; kalın harflerde "ı"ya yaklaşır. Üstün üstte-esre altta: yer, sesin adresidir.',
    examples: [
      { ar: 'بِ', latin: 'bi', ses: 's-be-i' },
      { ar: 'تِ', latin: 'ti', ses: 's-te-i' },
      { ar: 'جِ', latin: 'ci', ses: 's-cim-i' },
      { ar: 'حِ', latin: 'hi', ses: 's-ha-i' },
      { ar: 'دِ', latin: 'di', ses: 's-dal-i' },
      { ar: 'رِ', latin: 'ri', ses: 's-ra-i' },
      { ar: 'زِ', latin: 'zi', ses: 's-ze-i' },
      { ar: 'سِ', latin: 'si', ses: 's-sin-i' },
      { ar: 'عِ', latin: 'i (boğazdan)', ses: 's-ayn-i' },
      { ar: 'فِ', latin: 'fi', ses: 's-fe-i' },
      { ar: 'لِ', latin: 'li', ses: 's-lam-i' },
      { ar: 'مِ', latin: 'mi', ses: 's-mim-i' },
      { ar: 'عَلِمَ', latin: 'a-li-me', not: 'bildi (2:60)', ses: 'k-alime' },
      { ar: 'سَمِعَ', latin: 'se-mi-a', not: 'işitti (2:181)', ses: 'k-semia' },
      { ar: 'شَرِبَ', latin: 'şe-ri-be', not: 'içti (2:249)', ses: 'k-seribe' },
      { ar: 'عَمِلَ', latin: 'a-mi-le', not: 'yaptı (2:62)', ses: 'k-amile' },
      { ar: 'فَرِحَ', latin: 'fe-ri-ha', not: 'sevindi (9:81)', ses: 'k-feriha' },
      { ar: 'حَفِظَ', latin: 'ha-fi-za', not: 'korudu (4:34)', ses: 'k-hafiza' },
    ],
    tip: 'Kalın harflerin esresi "ı"ya çalar: صِ "sı", طِ "tı". İnce harflerde net "i" duyulur: بِ "bi", سِ "si".',
  },
  {
    id: 'otre', icon: '➰', bolum: 'Harekeler', title: 'Ötre (Damme): "u / ü" Sesi',
    intro: 'Ötre, harfin üstüne konan küçük vav işaretidir (ــُ) ve harfi "u" (kalın harflerde) ya da "ü"ye yakın (ince harflerde) okutur. Üç harekeyi de öğrendiniz — artık harekeli her harfi okuyabilirsiniz!',
    examples: [
      { ar: 'بُ', latin: 'bü', ses: 's-be-u' },
      { ar: 'تُ', latin: 'tü', ses: 's-te-u' },
      { ar: 'جُ', latin: 'cü', ses: 's-cim-u' },
      { ar: 'حُ', latin: 'hu', ses: 's-ha-u' },
      { ar: 'خُ', latin: 'hu (hırıltılı)', ses: 's-hi-u' },
      { ar: 'دُ', latin: 'dü', ses: 's-dal-u' },
      { ar: 'رُ', latin: 'ru', ses: 's-ra-u' },
      { ar: 'سُ', latin: 'sü', ses: 's-sin-u' },
      { ar: 'عُ', latin: 'u (boğazdan)', ses: 's-ayn-u' },
      { ar: 'قُ', latin: 'ku (kalın)', ses: 's-kaf-u' },
      { ar: 'مُ', latin: 'mü', ses: 's-mim-u' },
      { ar: 'نُ', latin: 'nü', ses: 's-nun-u' },
      { ar: 'كُتُب', latin: 'kü-tüb', not: 'kitaplar (2:285)', ses: 'k-kutub' },
      { ar: 'رُسُل', latin: 'rü-sül', not: 'elçiler (2:285)', ses: 'k-rusul' },
      { ar: 'سُبُل', latin: 'sü-bül', not: 'yollar (16:69)', ses: 'k-subul' },
      { ar: 'أُذُن', latin: 'ü-zün', not: 'kulak (9:61)', ses: 'k-uzun' },
      { ar: 'خُلُق', latin: 'hu-luk', not: 'ahlâk (68:4)', ses: 'k-huluk' },
      { ar: 'خُلِقَ', latin: 'hu-li-ka', not: 'yaratıldı (86:5) — ötre + esre bir arada', ses: 'k-hulika' },
    ],
    tip: 'Üç harekenin özeti: üstün → e/a, esre → i/ı, ötre → ü/u. İşaretin YERİ (üst, alt, üstte vav) size sesini söyler.',
  },
  {
    id: 'hece', icon: '🧩', bolum: 'Harekeler', title: 'Karışık Hece Okuma',
    intro: 'Şimdi üç harekeyi karıştırıp gerçek kelimeler okuyalım. Önce heceleyerek (ke-te-be), sonra akıcı biçimde okuyun. Her kelimeyi dinleyin, duraklatın, yüksek sesle taklit edin — sonra bir daha dinleyip kendinizi kontrol edin.',
    examples: [
      { ar: 'لَكَ', latin: 'le-ke', not: 'senin için', ses: 'k-leke' },
      { ar: 'لَهُ', latin: 'le-hü', not: 'onun için (2:255)', ses: 'k-lehu' },
      { ar: 'مَعَ', latin: 'me-a', not: 'ile, beraber (2:153)', ses: 'k-mea' },
      { ar: 'فَهِمَ', latin: 'fe-hi-me', not: 'anladı', ses: 'k-fehime' },
      { ar: 'كُتِبَ', latin: 'kü-ti-be', not: 'yazıldı (2:183)', ses: 'k-kutibe' },
      { ar: 'وُلِدَ', latin: 'vü-li-de', not: 'doğdu (19:15)', ses: 'k-vulide' },
      { ar: 'سُئِلَ', latin: 'sü-i-le', not: 'soruldu (81:8)', ses: 'k-suile' },
      { ar: 'كَرُمَ', latin: 'ke-ru-me', not: 'cömert oldu', ses: 'k-kerume' },
      { ar: 'حَسُنَ', latin: 'ha-sü-ne', not: 'güzel oldu (4:69)', ses: 'k-hasune' },
      { ar: 'نَزَلَ', latin: 'ne-ze-le', not: 'indi (26:193)', ses: 'k-nezele' },
      { ar: 'عَجِبَ', latin: 'a-ci-be', not: 'şaştı (50:2)', ses: 'k-acibe' },
      { ar: 'بَعَثَ', latin: 'be-a-se', not: 'gönderdi (2:213)', ses: 'k-bease' },
    ],
    tip: 'Günde 10 dakika sesli hece çalışması, birkaç haftada akıcılık kazandırır. Bir kelimeyi üç kez dinleyip üç kez tekrar etmek, on kez art arda dinlemekten iyidir.',
  },

  // ---------------- BÖLÜM 3: İŞARETLER ----------------
  {
    id: 'tenvin', icon: '〰️', bolum: 'İşaretler', title: 'Tenvin: Çift Harekeler',
    intro: 'Kelime sonundaki ÇİFT harekeler sese "n" ekler: çift üstün ــً "en/an", çift esre ــٍ "in", çift ötre ــٌ "un". Tenvin yalnız isimlerin sonunda bulunur.',
    examples: [
      { ar: 'كِتَابًا', latin: 'kitâben', not: 'çift üstün (18:1)', ses: 'k-kitaben' },
      { ar: 'عَلِيمٌ', latin: 'alîmun', not: 'çift ötre — her şeyi bilen (2:32)', ses: 'k-alimun' },
      { ar: 'يَوْمَئِذٍ', latin: 'yevmeizin', not: 'çift esre — o gün (99:4)', ses: 'k-yevmeizin' },
      { ar: 'سَلَامٌ', latin: 'selâmun', not: '(97:5)', ses: 'k-selamun' },
      { ar: 'غَفُورٌ', latin: 'ğafûrun', not: '(2:173)', ses: 'k-gafurun' },
      { ar: 'رَحِيمًا', latin: 'rahîmen', not: '(4:100)', ses: 'k-rahimen' },
      { ar: 'شَيْءٍ', latin: 'şey’in', not: '(2:20)', ses: 'k-seyin' },
      { ar: 'أَجْرٌ', latin: 'ecrun', not: 'ödül (2:62)', ses: 'k-ecrun' },
      { ar: 'نُورٌ', latin: 'nûrun', not: '(5:15)', ses: 'k-nurun' },
      { ar: 'هُدًى', latin: 'hüden', not: 'çift üstün elifsiz de yazılır (2:2)', ses: 'k-huden' },
    ],
    tip: 'Tenvinli kelimede durursanız: çift üstün "â" olur (kitâben → kitâbâ), çift esre ve çift ötre tamamen düşer (alîmun → alîm). Tenvinin "n"si sonraki kelimeye göre de değişebilir — bunu tecvid derslerinde göreceğiz.',
  },
  {
    id: 'cezm', icon: '⏸️', bolum: 'İşaretler', title: 'Cezm (Sükûn): Sessiz Harf',
    intro: 'Cezm (ــْ), harfin harekesiz-sessiz olduğunu gösterir: harf kendi sesini vermez, önceki heceye eklenip onu kapatır. "Kul" derken lam nasıl kapanıyorsa, قُلْ da öyle okunur.',
    examples: [
      { ar: 'قُلْ', latin: 'kul', not: 'de! (112:1)', ses: 'k-kul' },
      { ar: 'كُنْ', latin: 'kün', not: 'ol! (2:117)', ses: 'k-kun' },
      { ar: 'مِنْ', latin: 'min', not: '-den, -dan (1:7)', ses: 'k-min' },
      { ar: 'هَلْ', latin: 'hel', not: 'mı, mi? (76:1)', ses: 'k-hel' },
      { ar: 'أَمْ', latin: 'em', not: 'yoksa (2:6)', ses: 'k-em' },
      { ar: 'عَبْد', latin: 'abd', not: 'ayn açık, be sakin', ses: 'k-abd' },
      { ar: 'فَجْر', latin: 'fecr', not: 'cim sakin (89:1)', ses: 'k-fecr' },
      { ar: 'ذِكْر', latin: 'zikr', not: 'kef sakin (15:9)', ses: 'k-zikr' },
      { ar: 'صَبْر', latin: 'sabr', not: 'be sakin (2:153)', ses: 'k-sabr' },
      { ar: 'أَكْبَر', latin: 'ekber', not: 'en büyük (9:72)', ses: 'k-ekber' },
      { ar: 'يَعْلَمُ', latin: 'ya’lemü', not: 'bilir — ayn sakin (2:30)', ses: 'k-yalemu' },
      { ar: 'أَنْعَمْتَ', latin: 'en-am-te', not: 'nimet verdin — iki sakin harf (1:7)', ses: 'k-enamte' },
    ],
    tip: 'Sakin harf hece sonudur: ab, eb, kul, min. Sakin harfi asla harekeli gibi açmayın; "kulü" değil "kul".',
  },
  {
    id: 'sedde', icon: '🔁', bolum: 'İşaretler', title: 'Şedde: İkiz Harf',
    intro: 'Şedde (ــّ) harfi İKİZLEŞTİRİR: aynı harf önce sakin, sonra harekeli okunur. رَبِّ aslında رَبْ + بِ demektir: rab-bi. Şeddeye basmak, Kur\'an okuyuşuna hakkını vermektir.',
    examples: [
      { ar: 'رَبِّ', latin: 'rab-bi', not: 'Rabbim (1:2)', ses: 'k-rabbi' },
      { ar: 'إِنَّ', latin: 'in-ne', not: 'şüphesiz (2:20) — şeddeli nun genizden tınlar', ses: 'k-inne' },
      { ar: 'ثُمَّ', latin: 'süm-me', not: 'sonra (2:29)', ses: 'k-summe' },
      { ar: 'عَمَّ', latin: 'am-me', not: 'neden? (78:1)', ses: 'k-amme' },
      { ar: 'كَلَّا', latin: 'kel-lâ', not: 'hayır, asla! (96:6)', ses: 'k-kella' },
      { ar: 'مُحَمَّد', latin: 'mu-ham-med', not: '(47:2)', ses: 'k-muhammed' },
      { ar: 'سَبَّحَ', latin: 'seb-be-ha', not: 'tesbih etti (57:1)', ses: 'k-sebbeha' },
      { ar: 'قَدَّرَ', latin: 'kad-de-ra', not: 'takdir etti (80:19)', ses: 'k-kaddera' },
      { ar: 'رَبُّكُمْ', latin: 'rab-bü-küm', not: 'Rabbiniz (2:21)', ses: 'k-rabbukum' },
      { ar: 'أَمَّا', latin: 'em-mâ', not: 'ise, gelince (2:26)', ses: 'k-emma' },
    ],
    tip: 'Şeddeli harfi tek harf gibi geçiştirmeyin: önce durur gibi basın, sonra hareke ile açın. Şeddeli نّ ve مّ ayrıca genizden tınlar (ğunne) — tecvid bölümünde derinleşeceğiz.',
  },

  // ---------------- BÖLÜM 4: UZATMA ----------------
  {
    id: 'med', icon: '📏', bolum: 'Uzatma', title: 'Med Harfleri: â î û',
    intro: 'Üç harf, kendinden önceki sesi bir elif miktarı (yaklaşık bir saniye) uzatır: elif (ا) üstünü "â", sakin ye (ي) esreyi "î", sakin vav (و) ötreyi "û" yapar. Uzatma, Kur\'an tilavetinin nefesidir.',
    examples: [
      { ar: 'بَا', latin: 'bâ', not: 'be + elif', ses: 's-be-med' },
      { ar: 'بِي', latin: 'bî', not: 'bi + ye', ses: 's-bi-med' },
      { ar: 'بُو', latin: 'bû', not: 'bü + vav', ses: 's-bu-med' },
      { ar: 'قَالَ', latin: 'kâ-le', not: 'dedi (2:30)', ses: 'k-kale' },
      { ar: 'قِيلَ', latin: 'kî-le', not: 'denildi (2:11)', ses: 'k-kile' },
      { ar: 'يَقُولُ', latin: 'ye-kû-lü', not: 'der (2:8)', ses: 'k-yekulu' },
      { ar: 'كِتَاب', latin: 'ki-tâb', not: '(2:2)', ses: 'k-kitab' },
      { ar: 'سَمِيع', latin: 'se-mî', not: 'işiten (2:127)', ses: 'k-semi' },
      { ar: 'صِرَاط', latin: 'sı-rât', not: 'yol — kalın harf + med (1:6)', ses: 'k-sirat' },
      { ar: 'مُوسَى', latin: 'mû-sâ', not: '(2:51)', ses: 'k-musa' },
      { ar: 'نُوحِيهَا', latin: 'nû-hî-hâ', not: 'üç uzatma bir arada (11:49)', ses: 'k-nuhiha' },
      { ar: 'يُوسُف', latin: 'yû-süf', not: '(12:4)', ses: 'k-yusuf' },
    ],
    tip: 'Uzatmayı yutmayın ama abartmayın da: normal hareke bir vuruşsa, med iki vuruştur. "Kale" değil "kâââle" de değil — "kâle".',
  },
  {
    id: 'med-isaret', icon: '🗡️', bolum: 'Uzatma', title: 'Hançer Elif ve Lîn Harfleri',
    intro: 'İki incelik: Hançer elif (ــٰ), yazıda gösterilmeyen ama okunan küçük dik eliftir — رَحْمَٰن aslında "rahmân" okunur. Lîn harfleri ise üstünden sonra gelen sakin و ve ي\'dir: yumuşak "ev/av" ve "ey/ay" sesi verirler.',
    examples: [
      { ar: 'رَحْمَٰن', latin: 'rah-mân', not: 'hançer elif (1:3)', ses: 'k-rahman' },
      { ar: 'إِلَٰه', latin: 'i-lâh', not: 'ilah (2:163)', ses: 'k-ilah' },
      { ar: 'مَٰلِك', latin: 'mâ-lik', not: 'sahip (1:4)', ses: 'k-malik' },
      { ar: 'هَٰذَا', latin: 'hâ-zâ', not: 'bu (2:25)', ses: 'k-haza' },
      { ar: 'ذَٰلِكَ', latin: 'zâ-li-ke', not: 'işte o (2:2)', ses: 'k-zalike' },
      { ar: 'خَوْف', latin: 'havf', not: 'korku — lîn vavı (106:4)', ses: 'k-havf' },
      { ar: 'يَوْم', latin: 'yevm', not: 'gün — lîn vavı (1:4)', ses: 'k-yevm' },
      { ar: 'بَيْت', latin: 'beyt', not: 'ev — lîn yesi (106:3)', ses: 'k-beyt' },
      { ar: 'كَيْف', latin: 'keyf', not: 'nasıl — lîn yesi (105:1)', ses: 'k-keyf' },
      { ar: 'قُرَيْش', latin: 'ku-reyş', not: '(106:1)', ses: 'k-kureys' },
    ],
    tip: 'Hançer elifi Mushaf\'ta küçük dik çizgi olarak görürsünüz; normal elif gibi bir elif miktarı uzatın. Lîn harflerinde uzatma yoktur — ses yumuşakça kayar: "yevm", "beyt".',
  },

  // ---------------- BÖLÜM 5: KURALLAR ----------------
  {
    id: 'elif-lam', icon: '🌙', bolum: 'Kurallar', title: 'Elif-Lâm Takısı: Şemsî ve Kamerî',
    intro: 'Arapçanın belirlilik takısı ال iki türlü okunur. Kamerî (ay) harflerde lam AÇIKÇA okunur: el-kamer. Şemsî (güneş) harflerde lam yazılır ama OKUNMAZ; sonraki harf şeddelenir: eş-şems. Yazıdaki ipucu: şemsîde sonraki harfin üstünde şedde vardır.',
    examples: [
      { ar: 'الْقَمَرُ', latin: 'el-kameru', not: 'kamerî — lam okunur (54:1)', ses: 'k-elkamer' },
      { ar: 'الشَّمْسُ', latin: 'eş-şemsü', not: 'şemsî — lam okunmaz (91:1)', ses: 'k-essems' },
      { ar: 'الْحَمْدُ', latin: 'el-hamdü', not: 'kamerî (1:2)', ses: 'k-elhamd' },
      { ar: 'الرَّحْمَٰنُ', latin: 'er-rahmânü', not: 'şemsî (55:1)', ses: 'k-errahman' },
      { ar: 'النَّاسُ', latin: 'en-nâsü', not: 'şemsî (114:1)', ses: 'k-ennas' },
      { ar: 'الْكِتَابُ', latin: 'el-kitâbü', not: 'kamerî (2:2)', ses: 'k-elkitab' },
      { ar: 'السَّمَاءُ', latin: 'es-semâü', not: 'şemsî (2:19)', ses: 'k-essema' },
      { ar: 'الدِّينُ', latin: 'ed-dînü', not: 'şemsî (1:4)', ses: 'k-eddin' },
      { ar: 'الْأَرْضُ', latin: 'el-ardu', not: 'kamerî (2:22)', ses: 'k-elard' },
      { ar: 'اللَّيْلُ', latin: 'el-leylü', not: 'şemsî — lam lam\'a katılır (92:1)', ses: 'k-elleyl' },
    ],
    tip: 'Pratik kural: takıdan sonraki harfte şedde varsa lam okunmaz (şemsî), cezm ya da hareke varsa okunur (kamerî). Ezber gerekmez — yazı size söyler.',
  },

  // ---------------- BÖLÜM 6: TECVİD ----------------
  {
    id: 'med-cesitleri', icon: '🎵', bolum: 'Tecvid', title: 'Med Çeşitleri: Uzatmanın Ölçüsü',
    intro: 'Uzatmanın üzerine hemze veya sükûn gelirse med büyür: medd-i muttasıl (hemze AYNI kelimede, 4 elif), medd-i munfasıl (hemze SONRAKİ kelimede, 4 elife kadar), medd-i lâzım (sükûn/şedde ile, 4 elif). Bu dersten itibaren örnekleri Husary\'nin tam ayet tilavetiyle dinliyoruz — kuralın geçtiği kelimeye kulak verin.',
    examples: [
      { ar: 'إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ', latin: 'câââe', not: 'muttasıl: جَاءَ — hemze aynı kelimede', ayet: '110:1' },
      { ar: 'وَالسَّمَاءِ ذَاتِ الْبُرُوجِ', latin: 'es-semâââi', not: 'muttasıl: السَّمَاءِ', ayet: '85:1' },
      { ar: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ', latin: 'innâ a’taynâke', not: 'munfasıl: إِنَّا ile أَعْطَيْنَا arası', ayet: '108:1' },
      { ar: 'وَلَا الضَّالِّينَ', latin: 'veleddâââllîn', not: 'medd-i lâzım: şeddeye dayanan uzatma (1:7 sonu)', ayet: '1:7' },
      { ar: 'الٓمٓ', latin: 'elif-lâââm-mîîîm', not: 'hurûf-u mukattaa — lâzım med', ayet: '2:1' },
      { ar: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', latin: 'nestaîîîn', not: 'ârız med: durak sebebiyle uzar (ayet sonu)', ayet: '1:5' },
    ],
    tip: 'Mushaf\'taki med işareti (ٓ) "burada fazladan uzat" der. Kâri ile birlikte sayın: normal med 2 vuruş, büyük medler 8 vuruşa kadar çıkar.',
  },
  {
    id: 'nun-sakin', icon: '🌀', bolum: 'Tecvid', title: 'Nun-i Sakin ve Tenvin Halleri',
    intro: 'Sakin nun (نْ) veya tenvinden sonra gelen harfe göre DÖRT hal vardır: İZHAR (boğaz harfinde açıkça "n"), İDGAM (يرملون harflerinde sonrakine katılır), İKLAB (ب\'de "m"ye döner), İHFA (kalan 15 harfte genizden gizlenir). Tam ayetlerde işaretli kelimeleri dinleyin.',
    examples: [
      { ar: 'وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ', latin: 'küfüven ehad', not: 'izhar: tenvin + hemze → açık "n"', ayet: '112:4' },
      { ar: 'فَمَنْ يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ', latin: 'mey-ya’mel … hayray-yerah', not: 'idgam: نْ + ي ve tenvin + ي katılır', ayet: '99:7' },
      { ar: 'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ', latin: 'lehebiv-ve tebb', not: 'idgam: tenvin + و', ayet: '111:1' },
      { ar: 'لَنَسْفَعًا بِالنَّاصِيَةِ', latin: 'lenesfeam-bin-nâsiyeh', not: 'iklab: tenvin + ب → "m"', ayet: '96:15' },
      { ar: 'الَّذِينَ هُمْ عَنْ صَلَاتِهِمْ سَاهُونَ', latin: 'an(g)-salâtihim', not: 'ihfa: نْ + ص genizden gizlenir', ayet: '107:5' },
      { ar: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ…', latin: 'en-amte', not: 'izhar: نْ + ع (boğaz harfi)', ayet: '1:7' },
    ],
    tip: 'Ezber kolaylığı: boğaz harfleri (ء ه ع ح غ خ) → izhar; يرملون → idgam; ب → iklab; geri kalan 15 harf → ihfa. Kulağınız kâriden bu dört rengi ayırt etmeyi öğrenecek.',
  },
  {
    id: 'mim-sakin', icon: '🎶', bolum: 'Tecvid', title: 'Mim-i Sakin ve Ğunne',
    intro: 'Sakin mim (مْ) üç hal bilir: sonrasında م gelirse İDGAM-I MİSLEYN (ğunneli katma), ب gelirse İHFA-İ ŞEFEVÎ (dudak gizlemesi), diğer harflerde İZHAR. Şeddeli نّ ve مّ ise HER ZAMAN ğunneli — genizden yaklaşık iki vuruş tınlar.',
    examples: [
      { ar: 'الَّذِي أَطْعَمَهُمْ مِنْ جُوعٍ…', latin: 'at’amehüm-min', not: 'idgam-ı misleyn: مْ + م', ayet: '106:4' },
      { ar: 'تَرْمِيهِمْ بِحِجَارَةٍ مِنْ سِجِّيلٍ', latin: 'termîhim(b)-bi-hicâra', not: 'ihfa-i şefevî: مْ + ب', ayet: '105:4' },
      { ar: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ…', latin: 'elem tera', not: 'izhar: مْ + ت açık okunur', ayet: '105:1' },
      { ar: 'إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ', latin: 'innnne', not: 'şeddeli nun ğunnesi', ayet: '108:3' },
      { ar: 'ثُمَّ كَلَّا سَوْفَ تَعْلَمُونَ', latin: 'sümmmme', not: 'şeddeli mim ğunnesi', ayet: '102:4' },
      { ar: 'عَمَّ يَتَسَاءَلُونَ', latin: 'ammmme', not: 'idgamdan doğan ğunne', ayet: '78:1' },
    ],
    tip: 'Ğunne burnunuzdan gelen tınıdır: burnunuzu hafifçe tutup إِنَّ deyin — titreşimi hissetmiyorsanız ğunne yok demektir.',
  },
  {
    id: 'kalkale', icon: '🏀', bolum: 'Tecvid', title: 'Kalkale: Seken Harfler',
    intro: 'Beş harf (ق ط ب ج د — "kutbu ced") sakin olduğunda hafif bir seke/yaylanma ile okunur; ayet sonunda dururken bu seke daha belirgindir. Top yere vurup döner gibi: harf kapanır ve hafifçe geri açılır.',
    examples: [
      { ar: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', latin: 'el-felak(ı)', not: 'vakıfta kaf kalkalesi', ayet: '113:1' },
      { ar: 'قُلْ هُوَ اللَّهُ أَحَدٌ', latin: 'ehad(ı)', not: 'vakıfta dal kalkalesi', ayet: '112:1' },
      { ar: 'تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ', latin: 'veteb(b)', not: 'vakıfta şeddeli be kalkalesi', ayet: '111:1' },
      { ar: 'خَلَقَ الْإِنْسَانَ مِنْ عَلَقٍ', latin: 'alak(ı)', not: 'vakıfta kaf kalkalesi', ayet: '96:2' },
      { ar: 'أَلَمْ يَجْعَلْ كَيْدَهُمْ فِي تَضْلِيلٍ', latin: 'yec(i)’al', not: 'kelime içinde cim kalkalesi', ayet: '105:2' },
      { ar: 'إِنَّا أَنْزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ', latin: 'el-kadr(i)', not: 'vakıfta dal kalkalesi', ayet: '97:1' },
    ],
    tip: 'Kalkaleyi abartmayın: seke, tam bir "ı" harekesi değil kısa bir yaylanmadır. Kâriyi dinlerken ayet sonlarındaki bu küçük "zıplamayı" yakalamaya çalışın.',
  },
  {
    id: 'vakif', icon: '🛑', bolum: 'Tecvid', title: 'Durak (Vakıf) İşaretleri',
    intro: 'Ayet içindeki küçük harfler nerede durup nerede geçeceğinizi söyler. Durunca son harf sakin okunur (tenvinli çift üstün "â" olur). En sık göreceğiniz işaretler şunlardır:',
    examples: [
      { ar: 'مـ', latin: 'lâzım', not: 'durmak GEREKİR — geçersen anlam bozulur' },
      { ar: 'لا', latin: 'lâ', not: 'durma; nefes kesildiyse geriden alıp devam et' },
      { ar: 'ج', latin: 'câiz', not: 'durmak da geçmek de olur' },
      { ar: 'قلى', latin: 'kılâ', not: 'durmak evlâdır' },
      { ar: 'صلى', latin: 'salâ', not: 'geçmek evlâdır' },
      { ar: '∴ ∴', latin: 'muânaka', not: 'ikiz üç nokta: ikisinden YALNIZ birinde dur' },
      { ar: 'س', latin: 'sekte', not: 'nefes almadan kısa duruş (nadir)' },
    ],
    tip: 'Ayet sonu her zaman güvenli duraktır. İşaret yoksa ve nefesiniz yetmiyorsa anlamın bütünlüğünü bozmayan yerde durun, birkaç kelime geriden alın.',
  },

  // ---------------- BÖLÜM 7: PRATİK ----------------
  {
    id: 'pratik', icon: '🚀', bolum: 'Pratik', title: 'Pratik: Fatiha ile Uygulama',
    intro: 'Öğrendiğiniz her şey Fatiha\'da buluşur: medler, şeddeler, şemsî lamlar, ğunneler… Her ayeti dinleyin, kural notunu okuyun, kâri ile birlikte tekrar edin. Sonra sure sayfasını açıp kelime takibiyle okuyun.',
    examples: [
      { ar: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', latin: 'bismillâhir-rahmânir-rahîm', not: 'şemsî lam + hançer elif + med', ayet: '1:1' },
      { ar: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', latin: 'elhamdü lillâhi rabbil-âlemîn', not: 'kamerî lam + şedde + ârız med', ayet: '1:2' },
      { ar: 'الرَّحْمَٰنِ الرَّحِيمِ', latin: 'er-rahmânir-rahîm', not: 'şemsî lamlar', ayet: '1:3' },
      { ar: 'مَٰلِكِ يَوْمِ الدِّينِ', latin: 'mâliki yevmid-dîn', not: 'hançer elif + lîn vavı + şemsî lam', ayet: '1:4' },
      { ar: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', latin: 'iyyâke na’büdü ve iyyâke nestaîn', not: 'şeddeli ye + ayn + ârız med', ayet: '1:5' },
      { ar: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', latin: 'ihdinas-sırâtal-müstakîm', not: 'şemsî + kalın sad-tı + kamerî', ayet: '1:6' },
      { ar: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', latin: '…veleddâllîn', not: 'izhar (نْ+ع) + medd-i lâzım ile bitiş', ayet: '1:7' },
    ],
    tip: 'Sure sayfasında ▶ Dinle ile kâri eşliğinde okuyun; kelime takibi hangi kelimede olduğunuzu gösterir. Her gün 10 dakika — birkaç haftada Fatiha\'yı akıcı okuyacaksınız.',
  },
];

// Bölüm sırası (ders navigasyonunda gruplama için)
export const BOLUMLER = [...new Set(DERSLER.map((d) => d.bolum))];
