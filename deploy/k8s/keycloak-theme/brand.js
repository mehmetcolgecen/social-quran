// Alan adına göre marka: social-quran.com İngilizce kimlikle görünür.
// (Tema CSS'i host bilemez; tek satırlık bu betik başlığı değiştirir.)
document.addEventListener('DOMContentLoaded', function () {
  if (location.hostname.indexOf('social-quran') !== -1) {
    var b = document.getElementById('kc-header-wrapper');
    if (b) b.textContent = 'Social Quran';
    document.title = document.title.replace(/Sosyal Kur'an|sosyal-kuran/g, 'Social Quran');
  }
});
