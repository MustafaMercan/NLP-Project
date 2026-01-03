import { franc } from 'franc';
import { log } from '../utils/logger.js';

/**
 * Dil tespiti (franc kütüphanesi kullanarak)
 * Sadece Türkçe ve İngilizce'yi destekler
 */
export const detectLanguage = (text) => {
  if (!text || text.length === 0) {
    return 'tr'; // Varsayılan
  }
  
  // Çok kısa metinler için basit kontrol
  if (text.length < 10) {
    // Türkçe karakter kontrolü
    const turkishChars = /[çğıöşüÇĞIİÖŞÜ]/;
    return turkishChars.test(text) ? 'tr' : 'en';
  }
  
  try {
    // Franc ile dil tespiti (ISO 639-3 kodları döner: 'tur', 'eng', vb.)
    // Sadece Türkçe ve İngilizce'ye odaklanmak için minLength kullanıyoruz
    const detectedLang = franc(text, { minLength: 3 });
    
    // ISO 639-3 kodlarını bizim kod formatımıza çevir
    if (detectedLang === 'tur') {
      return 'tr'; // Türkçe
    } else if (detectedLang === 'eng') {
      return 'en'; // İngilizce
    } else {
      // Tespit edilemedi veya başka bir dil - varsayılan Türkçe
      // Ancak Türkçe karakter varsa Türkçe olarak kabul et
      const turkishChars = /[çğıöşüÇĞIİÖŞÜ]/;
      return turkishChars.test(text) ? 'tr' : 'en';
    }
    
  } catch (error) {
    log.warn(`Dil tespiti hatası: ${error.message}, varsayılan olarak Türkçe döndürülüyor`);
    // Hata durumunda basit kontrol
    const turkishChars = /[çğıöşüÇĞIİÖŞÜ]/;
    return turkishChars.test(text) ? 'tr' : 'en';
  }
};

/**
 * Metni diline göre normalize eder
 */
export const normalizeTextByLanguage = (text, language) => {
  if (!text) return '';
  
  // Temel temizleme
  let normalized = text
    .toLowerCase()
    .replace(/[^\w\sçğıöşüÇĞIİÖŞÜ]/g, ' ') // Özel karakterleri kaldır
    .replace(/\s+/g, ' ')
    .trim();
  
  // Dil bazlı özel işlemler
  if (language === 'tr') {
    // Türkçe için özel karakterleri koru
    normalized = normalized.replace(/[çğıöşü]/g, (char) => {
      const map = {
        'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u'
      };
      return map[char] || char;
    });
  }
  
  return normalized;
};

