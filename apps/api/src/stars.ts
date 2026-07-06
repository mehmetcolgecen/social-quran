// Yıldız/ödül sistemi: kullanıcının public yorumlarının aldığı toplam beğeniye göre 0-5 yıldız.
// Eşikler bilinçli olarak alçak başlar (ilk beğeni ilk yıldızı getirir → erken teşvik).
export const STAR_THRESHOLDS = [1, 10, 50, 200, 1000];

export const starsFor = (totalLikes: number): number =>
  STAR_THRESHOLDS.filter((t) => totalLikes >= t).length;
