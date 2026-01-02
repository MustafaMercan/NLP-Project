import { log } from '../utils/logger.js';

/**
 * Basit dil tespiti (Türkçe karakterlere göre)
 */
export const detectLanguage = (text) => {
  if (!text || text.length === 0) {
    return 'tr'; // Varsayılan
  }
  
  // Türkçe karakterler
  const turkishChars = /[çğıöşüÇĞIİÖŞÜ]/;
  
  // Türkçe kelimeler (yaygın)
  const turkishWords = [
    've', 'bir', 'bu', 'ile', 'için', 'olan', 'olan', 'gibi', 'kadar',
    'haber', 'duyuru', 'etkinlik', 'akademik', 'öğrenci', 'üniversite',
    'araştırma', 'proje', 'fakülte', 'bölüm', 'enstitü', 'rektörlük',
  ];
  
  // İngilizce kelimeler (yaygın)
  const englishWords = [
    'the', 'and', 'for', 'with', 'from', 'this', 'that', 'news',
    'event', 'academic', 'student', 'university', 'research', 'project',
    'faculty', 'department', 'institute',
  ];
  
  const lowerText = text.toLowerCase();
  
  // Türkçe karakter kontrolü
  const hasTurkishChars = turkishChars.test(text);
  
  // Kelime sayımı
  let turkishWordCount = 0;
  let englishWordCount = 0;
  
  turkishWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) turkishWordCount += matches.length;
  });
  
  englishWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) englishWordCount += matches.length;
  });
  
  // Karar verme
  if (hasTurkishChars) {
    return 'tr';
  }
  
  if (turkishWordCount > englishWordCount * 1.5) {
    return 'tr';
  }
  
  if (englishWordCount > turkishWordCount * 1.5) {
    return 'en';
  }
  
  // Varsayılan olarak Türkçe
  return 'tr';
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

