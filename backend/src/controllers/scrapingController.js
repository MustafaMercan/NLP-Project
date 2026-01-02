import { scrapeGTUData, processSearchResults } from '../services/scraperService.js';
import { wideSearchGTU, searchByCategory, searchMultipleQueries } from '../services/searchService.js';
import { extractGTUDomains, extractDomainsFromUrl, discoverGTUPages } from '../services/domainService.js';
import { extractStructuredContent } from '../services/contentExtractorService.js';
import ScrapedData from '../models/ScrapedData.js';
import SearchHistory from '../models/SearchHistory.js';
import StructuredContent from '../models/StructuredContent.js';
import { log } from '../utils/logger.js';

/**
 * 1. AŞAMA: Sadece arama yapar, URL'leri bulur ve console'a yazdırır
 * Veritabanına kaydetmez, sadece URL'leri döner
 */
export const searchUrls = async (req, res) => {
  try {
    const {
      query = 'Gebze Teknik Üniversitesi',
      maxResults = 10,
      wideSearch = 'false',
      category,
      maxResultsPerQuery = 5,
    } = req.query;

    log.info('=== 1. AŞAMA: URL Arama Başlatılıyor ===');
    log.info(`Arama sorgusu: "${query}"`);
    log.info(`Maksimum sonuç: ${maxResults}`);

    let searchResults = [];
    let searchQuery = query;

    // Geniş arama modu
    if (wideSearch === 'true') {
      log.info('Geniş arama modu aktif');
      searchQuery = 'Geniş Arama (Tüm Kategoriler)';
      searchResults = await wideSearchGTU(
        parseInt(maxResultsPerQuery),
        parseInt(maxResults)
      );
    } else if (category) {
      // Kategori bazlı arama
      log.info(`Kategori bazlı arama: ${category}`);
      searchQuery = `Kategori: ${category}`;
      searchResults = await searchByCategory(category, parseInt(maxResults));
    } else {
      // Normal tek sorgu araması
      const { searchWeb } = await import('../services/scraperService.js');
      searchResults = await searchWeb(query, parseInt(maxResults));
    }

    if (searchResults.length === 0) {
      log.warn('Hiç arama sonucu bulunamadı!');
      return res.json({
        success: true,
        message: 'Arama tamamlandı, ancak sonuç bulunamadı',
        stage: 1,
        resultsCount: 0,
        urls: [],
      });
    }

    // URL'leri console'a yazdır
    log.info(`\n=== ${searchResults.length} URL BULUNDU ===\n`);
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('           1. AŞAMA SONUÇLARI - BULUNAN URL\'LER');
    console.log('═══════════════════════════════════════════════════════\n');

    searchResults.forEach((result, index) => {
      console.log(`[${index + 1}] ${result.title || 'Başlık yok'}`);
      console.log(`    URL: ${result.url}`);
      if (result.snippet) {
        console.log(`    Özet: ${result.snippet.substring(0, 100)}...`);
      }
      if (result.searchQuery) {
        console.log(`    Sorgu: ${result.searchQuery}`);
      }
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log(`Toplam ${searchResults.length} URL bulundu`);
    console.log('═══════════════════════════════════════════════════════\n');

    // Response döndür (DB'ye kaydetme)
    res.json({
      success: true,
      message: '1. Aşama tamamlandı - URL\'ler bulundu (veritabanına kaydedilmedi)',
      stage: 1,
      resultsCount: searchResults.length,
      searchQuery: searchQuery,
      urls: searchResults.map((result) => ({
        url: result.url,
        title: result.title,
        snippet: result.snippet,
        searchQuery: result.searchQuery || searchQuery,
      })),
    });
  } catch (error) {
    log.error(`URL arama hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Domain ve subdomain analizi endpoint'i (tek sayfa)
 */
export const analyzeDomains = async (req, res) => {
  try {
    const { url = 'https://www.gtu.edu.tr/en' } = req.query;
    
    log.info(`Domain analizi başlatılıyor: ${url}`);
    
    const result = await extractDomainsFromUrl(url);
    
    res.json({
      success: true,
      message: 'Domain analizi tamamlandı',
      baseUrl: result.baseUrl,
      totalUrls: result.totalUrls,
      domainsCount: result.domains.length,
      subdomainsCount: result.subdomains.length,
      domains: result.domains,
      subdomains: result.subdomains,
      sampleUrls: result.sampleUrls.slice(0, 50), // İlk 50 URL
    });
    
  } catch (error) {
    log.error(`Domain analizi hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Recursive GTU sayfa keşfi endpoint'i
 */
export const discoverGTU = async (req, res) => {
  try {
    const {
      url = 'https://www.gtu.edu.tr/en',
      maxDepth = 2,
      maxPages = 50,
      saveToDb = 'true', // Varsayılan olarak kaydet
    } = req.query;
    
    log.info(`GTU recursive keşif başlatılıyor: ${url}`);
    
    const result = await discoverGTUPages(
      url,
      parseInt(maxDepth),
      parseInt(maxPages)
    );
    
    let searchHistoryId = null;
    let savedCount = 0;
    
    // Veritabanına kaydet (eğer isteniyorsa)
    if (saveToDb === 'true') {
      try {
        // SearchHistory kaydı oluştur
        const searchHistory = new SearchHistory({
          query: `GTU Recursive Keşif: ${url}`,
          status: 'completed',
          resultsCount: result.totalGtuUrls,
          completedAt: new Date(),
          foundUrls: result.gtuUrls.map((gtuUrl, index) => {
            // URL'in hangi sayfada bulunduğunu bul
            const foundInPage = result.visitedPages.find(visitedUrl => {
              try {
                const visitedObj = new URL(visitedUrl);
                const gtuUrlObj = new URL(gtuUrl);
                // Aynı domain ve path başlangıcı kontrolü
                return gtuUrl.startsWith(visitedUrl) || visitedUrl.includes(gtuUrlObj.pathname);
              } catch (e) {
                return false;
              }
            });
            
            return {
              url: gtuUrl,
              title: gtuUrl.split('/').pop() || gtuUrl, // Basit title
              snippet: `Keşfedilen URL (${foundInPage ? 'bulunduğu sayfa: ' + foundInPage : 'ana keşif'})`,
              searchQuery: `GTU Recursive Keşif`,
            };
          }),
        });
        
        await searchHistory.save();
        searchHistoryId = searchHistory._id;
        
        // Bulunan URL'leri ScrapedData'ya da kaydet (sadece URL, içerik yok)
        // Bu sayede daha sonra içerik çekilebilir
        for (const gtuUrl of result.gtuUrls) {
          try {
            // Duplicate kontrolü
            const existing = await ScrapedData.findOne({ url: gtuUrl });
            
            if (!existing) {
              // Sadece URL kaydet, içerik henüz çekilmedi
              const saved = new ScrapedData({
                title: gtuUrl.split('/').pop() || gtuUrl,
                content: '', // İçerik henüz çekilmedi
                url: gtuUrl,
                source: new URL(gtuUrl).hostname,
                metadata: {
                  discoveredAt: new Date(),
                  discoveryMethod: 'recursive',
                },
                searchQuery: `GTU Recursive Keşif`,
                isClassified: false,
              });
              
              await saved.save();
              savedCount++;
              log.info(`✓ URL kaydedildi: ${gtuUrl}`);
            } else {
              log.info(`→ URL zaten mevcut: ${gtuUrl}`);
            }
          } catch (error) {
            log.error(`URL kaydetme hatası (${gtuUrl}): ${error.message}`);
          }
        }
        
        log.info(`\n✓ Veritabanına ${savedCount} yeni URL kaydedildi`);
        log.info(`✓ SearchHistory kaydı oluşturuldu: ${searchHistoryId}`);
        
      } catch (dbError) {
        log.error(`Veritabanı kayıt hatası: ${dbError.message}`);
      }
    }
    
    res.json({
      success: true,
      message: saveToDb === 'true'
        ? `GTU recursive keşif tamamlandı, ${savedCount} yeni URL veritabanına kaydedildi`
        : 'GTU recursive keşif tamamlandı (veritabanına kaydedilmedi)',
      startUrl: result.startUrl,
      totalVisited: result.totalVisited,
      totalGtuUrls: result.totalGtuUrls,
      savedCount: saveToDb === 'true' ? savedCount : 0,
      searchHistoryId: searchHistoryId,
      domainsCount: result.domains.length,
      subdomainsCount: result.subdomains.length,
      visitedPages: result.visitedPages,
      gtuUrls: result.gtuUrls,
      domains: result.domains,
      subdomains: result.subdomains,
    });
    
  } catch (error) {
    log.error(`GTU recursive keşif hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Test: İçerik çekilmemiş URL'lerden içerik çeker (console output)
 */
export const testScrapeContent = async (req, res) => {
  try {
    const { limit = 10, saveToDb = 'true' } = req.query; // Varsayılan olarak kaydet
    
    log.info('=== İçerik Çekme Testi Başlatılıyor ===');
    
    // İçerik çekilmemiş (content boş veya çok kısa) kayıtları al
    const urlsToScrape = await ScrapedData.find({
      $or: [
        { content: { $exists: false } },
        { content: '' },
        { content: { $regex: /^\s*$/ } }, // Sadece whitespace
      ],
    })
      .limit(parseInt(limit))
      .select('url title _id')
      .lean();
    
    if (urlsToScrape.length === 0) {
      return res.json({
        success: true,
        message: 'İçerik çekilecek URL bulunamadı (tüm URL\'lerin içeriği zaten çekilmiş)',
        scrapedCount: 0,
        data: [],
      });
    }
    
    log.info(`${urlsToScrape.length} URL yapılandırılmış içerik çekilecek`);
    
    const scrapedData = [];
    const failedUrls = [];
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('      YAPILANDIRILMIŞ İÇERİK ÇEKME TEST SONUÇLARI');
    console.log('═══════════════════════════════════════════════════════\n');
    
    for (let i = 0; i < urlsToScrape.length; i++) {
      const urlData = urlsToScrape[i];
      log.info(`[${i + 1}/${urlsToScrape.length}] Yapılandırılmış içerik çekiliyor: ${urlData.url}`);
      
      try {
        // Yapılandırılmış içerik çek
        const structuredContent = await extractStructuredContent(urlData.url);
        
        if (structuredContent && structuredContent.cleanText && structuredContent.wordCount >= 10) {
          // Başlık için ScrapedData'dan veya ilk header'dan al
          const title = urlData.title || 
                       structuredContent.headers.find(h => h.level === 1)?.text ||
                       structuredContent.headers[0]?.text ||
                       urlData.url.split('/').pop();
          
          scrapedData.push({
            id: urlData._id,
            url: urlData.url,
            title: title,
            wordCount: structuredContent.wordCount,
            headersCount: structuredContent.headers.length,
            paragraphsCount: structuredContent.paragraphs.length,
            linksCount: structuredContent.links.length,
            imagesCount: structuredContent.images.length,
            listsCount: structuredContent.lists.length,
            cleanTextPreview: structuredContent.cleanText.substring(0, 300),
            structuredContent: structuredContent,
          });
          
          // Console'a yazdır
          console.log(`\n[${i + 1}] ✓ Başarılı: ${title}`);
          console.log(`    URL: ${urlData.url}`);
          console.log(`    Kelime sayısı: ${structuredContent.wordCount}`);
          console.log(`    Başlıklar: ${structuredContent.headers.length} (H1-H6)`);
          console.log(`    Paragraflar: ${structuredContent.paragraphs.length}`);
          console.log(`    Linkler: ${structuredContent.links.length} (${structuredContent.links.filter(l => l.isInternal).length} internal)`);
          console.log(`    Resimler: ${structuredContent.images.length}`);
          console.log(`    Listeler: ${structuredContent.lists.length}`);
          console.log(`    Temiz metin (ilk 200 karakter): ${structuredContent.cleanText.substring(0, 200)}...`);
          console.log('    ───────────────────────────────────────────────────');
          
          // Veritabanına kaydet (sadece başarılı olanlar)
          if (saveToDb === 'true') {
            try {
              // ScrapedData'yı güncelle
              const updateResult = await ScrapedData.updateOne(
                { _id: urlData._id },
                {
                  $set: {
                    title: title,
                    content: structuredContent.cleanText, // Classification için temiz metin
                    source: new URL(urlData.url).hostname,
                  },
                }
              );
              
              // StructuredContent kaydı oluştur veya güncelle
              const structuredResult = await StructuredContent.findOneAndUpdate(
                { scrapedDataId: urlData._id },
                {
                  $set: {
                    scrapedDataId: urlData._id,
                    headers: structuredContent.headers,
                    paragraphs: structuredContent.paragraphs,
                    links: structuredContent.links,
                    images: structuredContent.images,
                    lists: structuredContent.lists,
                    cleanText: structuredContent.cleanText,
                    wordCount: structuredContent.wordCount,
                    language: structuredContent.language,
                    extractedAt: new Date(),
                  },
                },
                { upsert: true, new: true }
              );
              
              if (updateResult.modifiedCount > 0 || structuredResult) {
                log.info(`  ✓ Yapılandırılmış içerik veritabanına kaydedildi: ${urlData.url}`);
              }
            } catch (dbError) {
              log.error(`  ✗ Veritabanı kayıt hatası: ${dbError.message}`);
              // Hata olsa bile devam et, sadece log'la
            }
          }
        } else {
          // Başarısız olanları ScrapedData'dan sil
          const reason = structuredContent 
            ? `Yetersiz içerik (${structuredContent.wordCount} kelime)` 
            : 'İçerik çekilemedi veya sayfa mevcut değil';
          
          failedUrls.push({
            url: urlData.url,
            reason: reason,
          });
          
          console.log(`\n[${i + 1}] ✗ Başarısız: ${urlData.url}`);
          console.log(`    Sebep: ${reason}`);
          console.log(`    🗑️  ScrapedData'dan siliniyor...`);
          
          // ScrapedData'dan sil
          try {
            await ScrapedData.deleteOne({ _id: urlData._id });
            
            // StructuredContent varsa onu da sil
            await StructuredContent.deleteOne({ scrapedDataId: urlData._id });
            
            log.info(`  ✓ ScrapedData'dan silindi: ${urlData.url}`);
            console.log(`    ✓ Silindi`);
          } catch (deleteError) {
            log.error(`  ✗ Silme hatası: ${deleteError.message}`);
            console.log(`    ✗ Silme hatası: ${deleteError.message}`);
          }
        }
      } catch (error) {
        // Hata durumunda ScrapedData'dan sil
        const reason = error.message.includes('404') || error.message.includes('Not Found')
          ? 'Sayfa mevcut değil (404)'
          : error.message.includes('timeout') || error.message.includes('ETIMEDOUT')
          ? 'Zaman aşımı'
          : error.message.includes('socket hang up') || error.message.includes('ECONNRESET')
          ? 'Bağlantı hatası'
          : error.message;
        
        failedUrls.push({
          url: urlData.url,
          reason: reason,
        });
        
        log.error(`  ✗ Yapılandırılmış içerik çekme hatası: ${reason}`);
        console.log(`\n[${i + 1}] ✗ Hata: ${urlData.url}`);
        console.log(`    Sebep: ${reason}`);
        console.log(`    🗑️  ScrapedData'dan siliniyor...`);
        
        // ScrapedData'dan sil
        try {
          await ScrapedData.deleteOne({ _id: urlData._id });
          
          // StructuredContent varsa onu da sil
          await StructuredContent.deleteOne({ scrapedDataId: urlData._id });
          
          log.info(`  ✓ ScrapedData'dan silindi: ${urlData.url}`);
          console.log(`    ✓ Silindi`);
        } catch (deleteError) {
          log.error(`  ✗ Silme hatası: ${deleteError.message}`);
          console.log(`    ✗ Silme hatası: ${deleteError.message}`);
        }
      }
      
      // Rate limiting
      if (i < urlsToScrape.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Başarılı kayıt sayısını hesapla
    const savedCount = saveToDb === 'true' ? scrapedData.length : 0;
    const deletedCount = failedUrls.length;
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`✓ Başarılı ve kaydedilen: ${savedCount}`);
    console.log(`✗ Başarısız ve silinen: ${deletedCount}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    res.json({
      success: true,
      message: saveToDb === 'true'
        ? `Yapılandırılmış içerik çekme tamamlandı, ${savedCount} başarılı veri kaydedildi, ${deletedCount} başarısız URL ScrapedData'dan silindi`
        : `Yapılandırılmış içerik çekme testi tamamlandı (veritabanına kaydedilmedi)`,
      totalUrls: urlsToScrape.length,
      successCount: scrapedData.length,
      failedCount: failedUrls.length,
      savedCount: savedCount,
      deletedCount: deletedCount,
      data: scrapedData.map(d => ({
        id: d.id,
        url: d.url,
        title: d.title,
        wordCount: d.wordCount,
        headersCount: d.headersCount,
        paragraphsCount: d.paragraphsCount,
        linksCount: d.linksCount,
        imagesCount: d.imagesCount,
        listsCount: d.listsCount,
        cleanTextPreview: d.cleanTextPreview,
        saved: saveToDb === 'true',
      })),
      failedUrls: failedUrls,
    });
    
  } catch (error) {
    log.error(`İçerik çekme testi hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * 2. AŞAMA: URL'lerden içerik çeker ve veritabanına kaydeder
 */
export const scrapeContentFromUrls = async (req, res) => {
  try {
    const { urls, searchQuery, limit } = req.body;

    // Eğer URL listesi verilmemişse, veritabanından içerik çekilmemiş kayıtları al
    let urlsToScrape = [];
    
    if (urls && Array.isArray(urls) && urls.length > 0) {
      // Manuel URL listesi verilmiş
      urlsToScrape = urls.map(url => ({ url }));
    } else {
      // Veritabanından içerik çekilmemiş kayıtları al
      const limitCount = limit || 50;
      const dbRecords = await ScrapedData.find({
        $or: [
          { content: { $exists: false } },
          { content: '' },
          { content: { $regex: /^\s*$/ } },
        ],
      })
        .limit(limitCount)
        .select('url _id')
        .lean();
      
      urlsToScrape = dbRecords.map(record => ({
        url: record.url,
        id: record._id,
      }));
    }

    if (urlsToScrape.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'İçerik çekilecek URL bulunamadı',
      });
    }

    log.info('=== 2. AŞAMA: İçerik Çekme Başlatılıyor ===');
    log.info(`${urlsToScrape.length} URL işlenecek`);

    const { scrapeUrl } = await import('../services/scraperService.js');
    const scrapedDataIds = [];
    const successCount = 0;
    const failedCount = 0;

    for (let i = 0; i < urlsToScrape.length; i++) {
      const urlData = urlsToScrape[i];
      log.info(`[${i + 1}/${urlsToScrape.length}] İşleniyor: ${urlData.url}`);

      try {
        const contentData = await scrapeUrl(urlData.url);

        if (contentData && contentData.content && contentData.content.length > 50) {
          // Veritabanına kaydet veya güncelle
          if (urlData.id) {
            // Mevcut kaydı güncelle
            await ScrapedData.updateOne(
              { _id: urlData.id },
              {
                $set: {
                  title: contentData.title,
                  content: contentData.content,
                  source: contentData.source,
                  metadata: contentData.metadata || {},
                },
              }
            );
            scrapedDataIds.push(urlData.id);
          } else {
            // Yeni kayıt oluştur
            const saved = new ScrapedData({
              title: contentData.title,
              content: contentData.content,
              url: contentData.url,
              source: contentData.source,
              metadata: contentData.metadata || {},
              searchQuery: searchQuery || '2. Aşama İçerik Çekme',
            });
            const savedData = await saved.save();
            scrapedDataIds.push(savedData._id);
          }

          log.info(`✓ Başarılı: ${contentData.title}`);
        } else {
          log.warn(`✗ İçerik yetersiz: ${urlData.url}`);
        }
      } catch (error) {
        log.error(`✗ Hata (${urlData.url}): ${error.message}`);
      }

      // Rate limiting
      if (i < urlsToScrape.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    res.json({
      success: true,
      message: `2. Aşama tamamlandı, ${scrapedDataIds.length} veri işlendi`,
      stage: 2,
      processedCount: urlsToScrape.length,
      successCount: scrapedDataIds.length,
      scrapedDataIds: scrapedDataIds,
    });
  } catch (error) {
    log.error(`İçerik çekme hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Yeni scraping işlemi başlatır
 */
export const startScraping = async (req, res) => {
  try {
    const {
      query = 'Gebze Teknik Üniversitesi',
      maxResults = 5,
      wideSearch = false,
      category,
      maxResultsPerQuery = 5,
    } = req.body;

    log.info(`Yeni scraping isteği: "${query}"`);

    // SearchHistory kaydı oluştur
    let searchQuery = query;
    if (wideSearch) {
      searchQuery = 'Geniş Arama (Tüm Kategoriler)';
    } else if (category) {
      searchQuery = `Kategori: ${category}`;
    }

    const searchHistory = new SearchHistory({
      query: searchQuery,
      status: 'in_progress',
    });
    await searchHistory.save();

    // Async olarak scraping başlat (response hemen dön)
    const scrapingPromise = (async () => {
      let scrapedData = [];

      if (wideSearch) {
        const { wideSearchGTU } = await import('../services/searchService.js');
        const searchResults = await wideSearchGTU(
          parseInt(maxResultsPerQuery),
          parseInt(maxResults)
        );
        scrapedData = await processSearchResults(searchResults, parseInt(maxResults));
      } else if (category) {
        const { searchByCategory } = await import('../services/searchService.js');
        const searchResults = await searchByCategory(category, parseInt(maxResults));
        scrapedData = await processSearchResults(searchResults, parseInt(maxResults));
      } else {
        scrapedData = await scrapeGTUData(query, parseInt(maxResults));
      }

      return scrapedData;
    })();

    scrapingPromise
      .then(async (scrapedData) => {
        const scrapedDataIds = [];

        // Her veriyi MongoDB'ye kaydet
        for (const data of scrapedData) {
          try {
            // Duplicate kontrolü (URL'ye göre)
            const existing = await ScrapedData.findOne({ url: data.url });

            if (!existing) {
              const saved = new ScrapedData({
                title: data.title,
                content: data.content,
                url: data.url,
                source: data.source,
                metadata: data.metadata || {},
                searchQuery: data.searchQuery || searchQuery,
              });

              const savedData = await saved.save();
              scrapedDataIds.push(savedData._id);
              log.info(`Veri kaydedildi: ${data.title}`);
            } else {
              scrapedDataIds.push(existing._id);
              log.info(`Veri zaten mevcut: ${data.url}`);
            }
          } catch (error) {
            log.error(`Veri kaydetme hatası: ${error.message}`);
          }
        }

        // SearchHistory'yi güncelle
        searchHistory.status = 'completed';
        searchHistory.resultsCount = scrapedDataIds.length;
        searchHistory.completedAt = new Date();
        searchHistory.scrapedDataIds = scrapedDataIds;
        await searchHistory.save();

        log.info(`Scraping tamamlandı: ${scrapedDataIds.length} veri kaydedildi`);
      })
      .catch(async (error) => {
        log.error(`Scraping hatası: ${error.message}`);
        searchHistory.status = 'failed';
        searchHistory.error = error.message;
        searchHistory.completedAt = new Date();
        await searchHistory.save();
      });

    // Hemen response dön
    res.json({
      success: true,
      message: 'Scraping işlemi başlatıldı',
      searchId: searchHistory._id,
      query,
    });
  } catch (error) {
    log.error(`Start scraping error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Scraping durumunu getirir
 */
export const getScrapingStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const searchHistory = await SearchHistory.findById(id);

    if (!searchHistory) {
      return res.status(404).json({
        success: false,
        message: 'Search history not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: searchHistory._id,
        query: searchHistory.query,
        status: searchHistory.status,
        resultsCount: searchHistory.resultsCount,
        startedAt: searchHistory.startedAt,
        completedAt: searchHistory.completedAt,
        error: searchHistory.error,
      },
    });
  } catch (error) {
    log.error(`Get scraping status error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Scraping sonuçlarını getirir
 */
export const getScrapingResults = async (req, res) => {
  try {
    const { id } = req.params;

    const searchHistory = await SearchHistory.findById(id).populate('scrapedDataIds');

    if (!searchHistory) {
      return res.status(404).json({
        success: false,
        message: 'Search history not found',
      });
    }

    res.json({
      success: true,
      data: {
        searchHistory: {
          id: searchHistory._id,
          query: searchHistory.query,
          status: searchHistory.status,
          resultsCount: searchHistory.resultsCount,
          startedAt: searchHistory.startedAt,
          completedAt: searchHistory.completedAt,
        },
        results: searchHistory.scrapedDataIds,
        foundUrls: searchHistory.foundUrls || [],
      },
    });
  } catch (error) {
    log.error(`Get scraping results error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Test endpoint - Console'a yazdırır ve veritabanına kaydeder
 */
export const testScraping = async (req, res) => {
  try {
    const {
      query = 'Gebze Teknik Üniversitesi',
      maxResults = 5,
      wideSearch = 'false',
      category,
      maxResultsPerQuery = 5,
      saveToDb = 'true', // Varsayılan olarak kaydet
    } = req.query;

    log.info('Test scraping başlatılıyor (console output)...');

    let scrapedData = [];
    let searchQuery = query; // Veritabanına kaydedilecek sorgu

    // Geniş arama modu
    if (wideSearch === 'true') {
      log.info('Geniş arama modu aktif');
      searchQuery = 'Geniş Arama (Tüm Kategoriler)';
      const searchResults = await wideSearchGTU(
        parseInt(maxResultsPerQuery),
        parseInt(maxResults)
      );

      // Sonuçları işle
      scrapedData = await processSearchResults(searchResults, parseInt(maxResults));
    } else if (category) {
      // Kategori bazlı arama
      log.info(`Kategori bazlı arama: ${category}`);
      searchQuery = `Kategori: ${category}`;
      const searchResults = await searchByCategory(category, parseInt(maxResults));

      scrapedData = await processSearchResults(searchResults, parseInt(maxResults));
    } else {
      // Normal tek sorgu araması
      scrapedData = await scrapeGTUData(query, parseInt(maxResults));
    }

    // Veritabanına kaydet (eğer isteniyorsa)
    let savedCount = 0;
    let searchHistoryId = null;

    if (saveToDb === 'true') {
      try {
        // SearchHistory kaydı oluştur
        const searchHistory = new SearchHistory({
          query: searchQuery,
          status: 'completed',
          resultsCount: scrapedData.length,
          completedAt: new Date(),
        });
        await searchHistory.save();
        searchHistoryId = searchHistory._id;

        const scrapedDataIds = [];

        // Her veriyi MongoDB'ye kaydet
        for (const data of scrapedData) {
          try {
            // Duplicate kontrolü (URL'ye göre)
            const existing = await ScrapedData.findOne({ url: data.url });

            if (!existing) {
              const saved = new ScrapedData({
                title: data.title,
                content: data.content,
                url: data.url,
                source: data.source,
                metadata: data.metadata || {},
                searchQuery: data.searchQuery || searchQuery,
              });

              const savedData = await saved.save();
              scrapedDataIds.push(savedData._id);
              savedCount++;
              log.info(`✓ Veri kaydedildi: ${data.title}`);
            } else {
              scrapedDataIds.push(existing._id);
              log.info(`→ Veri zaten mevcut: ${data.url}`);
            }
          } catch (error) {
            log.error(`Veri kaydetme hatası: ${error.message}`);
          }
        }

        // SearchHistory'yi güncelle
        searchHistory.scrapedDataIds = scrapedDataIds;
        await searchHistory.save();

        log.info(`\n✓ Veritabanına ${savedCount} yeni veri kaydedildi, ${scrapedDataIds.length - savedCount} veri zaten mevcuttu`);
      } catch (dbError) {
        log.error(`Veritabanı kayıt hatası: ${dbError.message}`);
      }
    }

    res.json({
      success: true,
      message: saveToDb === 'true'
        ? `Scraping tamamlandı, ${savedCount} yeni veri veritabanına kaydedildi`
        : 'Scraping tamamlandı (veritabanına kaydedilmedi)',
      resultsCount: scrapedData.length,
      savedCount: saveToDb === 'true' ? savedCount : 0,
      searchHistoryId: searchHistoryId,
      data: scrapedData,
    });
  } catch (error) {
    log.error(`Test scraping error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
