import { searchWeb } from './scraperService.js';
import { log } from '../utils/logger.js';

/**
 * GTU ile ilgili geniş arama sorguları oluşturur
 */
export const generateGTUQueries = (baseQuery = 'Gebze Teknik Üniversitesi') => {
  const queries = [
    // Temel sorgular
    baseQuery,
    `${baseQuery} haberler`,
    `${baseQuery} duyurular`,
    `${baseQuery} etkinlikler`,
    
    // Akademik sorgular
    `${baseQuery} araştırma`,
    `${baseQuery} projeler`,
    `${baseQuery} yayınlar`,
    `${baseQuery} akademik`,
    `${baseQuery} fakülteler`,
    `${baseQuery} bölümler`,
    
    // Öğrenci odaklı
    `${baseQuery} öğrenci`,
    `${baseQuery} öğrenci kulüpleri`,
    `${baseQuery} burs`,
    `${baseQuery} staj`,
    
    // Etkinlik ve haberler
    `${baseQuery} konferans`,
    `${baseQuery} seminer`,
    `${baseQuery} workshop`,
    `${baseQuery} güncel`,
    `${baseQuery} son dakika`,
    
    // Spesifik alanlar
    `${baseQuery} mühendislik`,
    `${baseQuery} teknoloji`,
    `${baseQuery} bilim`,
    `${baseQuery} inovasyon`,
    
    // Kısa formlar
    'GTU haberler',
    'GTU duyurular',
    'GTU etkinlikler',
    'GTÜ haberler',
    'GTÜ duyurular',
  ];
  
  return queries;
};

/**
 * Birden fazla sorgu ile arama yapar ve sonuçları birleştirir
 */
export const searchMultipleQueries = async (
  queries = [],
  maxResultsPerQuery = 5,
  maxTotalResults = 50
) => {
  try {
    log.info(`Çoklu arama başlatılıyor: ${queries.length} sorgu`);
    
    const allResults = [];
    const seenUrls = new Set(); // Duplicate kontrolü için
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      
      if (allResults.length >= maxTotalResults) {
        log.info(`Maksimum sonuç sayısına ulaşıldı: ${maxTotalResults}`);
        break;
      }
      
      log.info(`[${i + 1}/${queries.length}] Arama: "${query}"`);
      
      try {
        const results = await searchWeb(query, maxResultsPerQuery);
        
        // Duplicate kontrolü ve ekleme
        for (const result of results) {
          if (!seenUrls.has(result.url) && allResults.length < maxTotalResults) {
            seenUrls.add(result.url);
            allResults.push({
              ...result,
              searchQuery: query, // Hangi sorgu ile bulundu
            });
          }
        }
        
        log.info(`  → ${results.length} sonuç bulundu, ${allResults.length} toplam benzersiz sonuç`);
        
        // Rate limiting - her sorgu arasında bekle
        if (i < queries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        log.error(`  ✗ Sorgu hatası ("${query}"): ${error.message}`);
        continue; // Bir sorgu başarısız olsa bile devam et
      }
    }
    
    log.info(`\nToplam ${allResults.length} benzersiz sonuç bulundu`);
    return allResults;
    
  } catch (error) {
    log.error(`Çoklu arama hatası: ${error.message}`);
    throw error;
  }
};

/**
 * Geniş GTU araması - Tüm sorguları kullanarak kapsamlı arama
 */
export const wideSearchGTU = async (maxResultsPerQuery = 5, maxTotalResults = 50) => {
  const queries = generateGTUQueries();
  return await searchMultipleQueries(queries, maxResultsPerQuery, maxTotalResults);
};

/**
 * Kategori bazlı arama
 */
export const searchByCategory = async (category, maxResults = 10) => {
  const categoryQueries = {
    haberler: [
      'Gebze Teknik Üniversitesi haberler',
      'GTU haberler',
      'GTÜ haberler',
      'Gebze Teknik Üniversitesi güncel',
      'GTU son dakika',
    ],
    duyurular: [
      'Gebze Teknik Üniversitesi duyurular',
      'GTU duyurular',
      'GTÜ duyurular',
      'Gebze Teknik Üniversitesi açıklamalar',
    ],
    etkinlikler: [
      'Gebze Teknik Üniversitesi etkinlikler',
      'GTU etkinlikler',
      'GTÜ etkinlikler',
      'Gebze Teknik Üniversitesi konferans',
      'GTU seminer',
      'GTU workshop',
    ],
    akademik: [
      'Gebze Teknik Üniversitesi araştırma',
      'GTU projeler',
      'GTÜ yayınlar',
      'Gebze Teknik Üniversitesi akademik',
      'GTU fakülteler',
    ],
    öğrenci: [
      'Gebze Teknik Üniversitesi öğrenci',
      'GTU öğrenci kulüpleri',
      'GTÜ burs',
      'Gebze Teknik Üniversitesi staj',
    ],
  };
  
  const queries = categoryQueries[category.toLowerCase()] || [];
  
  if (queries.length === 0) {
    log.warn(`Bilinmeyen kategori: ${category}`);
    return [];
  }
  
  return await searchMultipleQueries(queries, maxResults, maxResults * 2);
};

