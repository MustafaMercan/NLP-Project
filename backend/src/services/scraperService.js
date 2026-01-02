import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import http from 'http';
import https from 'https';
import { log } from '../utils/logger.js';

/**
 * Web arama yaparak Gebze Teknik Üniversitesi ile ilgili URL'leri bulur
 * API key olmadan DuckDuckGo kullanarak arama yapar
 */
export const searchWeb = async (query = 'Gebze Teknik Üniversitesi', maxResults = 10) => {
  try {
    log.info(`Web araması başlatılıyor: "${query}"`);
    
    // DuckDuckGo arama URL'i (API key gerektirmez)
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    log.info(`Arama URL: ${searchUrl}`);
    
    // Puppeteer ile dinamik içerik için
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Sayfa içeriğini al
    const html = await page.content();
    await browser.close();
    
    // Cheerio ile parse et
    const $ = cheerio.load(html);
    const results = [];
    
    // DuckDuckGo sonuçlarını çek - farklı selector'ları dene
    // Yeni DuckDuckGo HTML yapısı için
    $('.result, .web-result, [data-testid="result"]').each((index, element) => {
      if (results.length >= maxResults) return false;
      
      const $result = $(element);
      
      // Farklı title selector'ları dene
      const title = $result.find('.result__a, .result-title, a.result__a, h2 a').first().text().trim() ||
                   $result.find('a').first().text().trim();
      
      // URL çek
      let url = $result.find('.result__a, a.result__a, h2 a').first().attr('href');
      
      // Eğer href yoksa, onclick veya data attribute'dan al
      if (!url) {
        const onclick = $result.find('a').first().attr('onclick');
        if (onclick) {
          const urlMatch = onclick.match(/uddg='([^']+)'/);
          if (urlMatch) url = urlMatch[1];
        }
      }
      
      // URL decode et (DuckDuckGo bazen encoded gönderir)
      if (url && url.startsWith('/l/?kh=')) {
        const decodedMatch = url.match(/uddg=([^&]+)/);
        if (decodedMatch) {
          url = decodeURIComponent(decodedMatch[1]);
        }
      }
      
      const snippet = $result.find('.result__snippet, .result-snippet, .snippet').text().trim();
      
      if (title && url && url.startsWith('http')) {
        results.push({
          title,
          url: url.startsWith('//') ? `https:${url}` : url,
          snippet: snippet || '',
        });
      }
    });
    
    // Eğer hala sonuç yoksa, sayfadaki tüm linkleri kontrol et
    if (results.length === 0) {
      log.info('Standart selector\'lar başarısız, alternatif yöntem deneniyor...');
      $('a[href*="http"]').each((index, element) => {
        if (results.length >= maxResults) return false;
        
        const $link = $(element);
        const title = $link.text().trim();
        let url = $link.attr('href');
        
        // DuckDuckGo redirect linklerini decode et
        if (url && url.includes('uddg=')) {
          const match = url.match(/uddg=([^&]+)/);
          if (match) {
            url = decodeURIComponent(match[1]);
          }
        }
        
        if (title && url && url.startsWith('http') && title.length > 10) {
          // Parent element'ten snippet al
          const snippet = $link.closest('div, article, section').text().substring(0, 150).trim();
          
          results.push({
            title,
            url,
            snippet,
          });
        }
      });
    }
    
    // Eğer DuckDuckGo'dan sonuç bulamazsa, alternatif yöntem dene
    if (results.length === 0) {
      log.warn('DuckDuckGo\'dan sonuç bulunamadı, alternatif yöntem deneniyor...');
      return await searchWithAlternativeMethod(query, maxResults);
    }
    
    log.info(`${results.length} arama sonucu bulundu`);
    return results;
    
  } catch (error) {
    log.error(`Web arama hatası: ${error.message}`);
    // Hata durumunda alternatif yöntemi dene
    return await searchWithAlternativeMethod(query, maxResults);
  }
};

/**
 * Alternatif arama yöntemi - Basit web scraping
 */
const searchWithAlternativeMethod = async (query, maxResults) => {
  try {
    log.info('Alternatif arama yöntemi kullanılıyor...');
    
    // Google arama (basit HTML scraping)
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${maxResults}`;
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Google'ın bot detection'ını bypass etmek için biraz bekle
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const html = await page.content();
    await browser.close();
    
    const $ = cheerio.load(html);
    const results = [];
    
    // Google sonuçlarını çek - farklı selector'ları dene
    $('div.g, div[data-ved], .tF2Cxc').each((index, element) => {
      if (results.length >= maxResults) return false;
      
      const $result = $(element);
      const title = $result.find('h3, .LC20lb, .DKV0Md').first().text().trim();
      let url = $result.find('a').first().attr('href');
      
      // Google'ın /url?q= formatını parse et
      if (url && url.startsWith('/url?q=')) {
        const match = url.match(/\/url\?q=([^&]+)/);
        if (match) {
          url = decodeURIComponent(match[1]);
        }
      }
      
      const snippet = $result.find('.VwiC3b, .s, .IsZvec, .st').first().text().trim();
      
      if (title && url && url.startsWith('http') && title.length > 5) {
        results.push({
          title,
          url,
          snippet: snippet || '',
        });
      }
    });
    
    // Eğer hala sonuç yoksa, direkt GTU web sitesini ve bilinen kaynakları ekle
    if (results.length === 0) {
      log.info('Google\'dan sonuç bulunamadı, bilinen kaynaklar ekleniyor...');
      return await getKnownGTUSources(query, maxResults);
    }
    
    log.info(`${results.length} sonuç bulundu (alternatif yöntem)`);
    return results;
    
  } catch (error) {
    log.error(`Alternatif arama hatası: ${error.message}`);
    // Son çare olarak bilinen kaynakları döndür
    return await getKnownGTUSources(query, maxResults);
  }
};

/**
 * Bilinen GTU kaynaklarını döndürür (fallback yöntem)
 */
const getKnownGTUSources = async (query, maxResults) => {
  try {
    log.info('Bilinen GTU kaynakları kullanılıyor...');
    
    const knownSources = [
      {
        title: 'Gebze Teknik Üniversitesi - Ana Sayfa',
        url: 'https://www.gtu.edu.tr',
        snippet: 'Gebze Teknik Üniversitesi resmi web sitesi',
      },
      {
        title: 'GTU Haberler',
        url: 'https://www.gtu.edu.tr/tr/haberler',
        snippet: 'Gebze Teknik Üniversitesi haberler ve duyurular',
      },
      {
        title: 'GTU Duyurular',
        url: 'https://www.gtu.edu.tr/tr/duyurular',
        snippet: 'Gebze Teknik Üniversitesi duyurular',
      },
    ];
    
    // Sadece istenen kadarını döndür
    return knownSources.slice(0, maxResults);
    
  } catch (error) {
    log.error(`Bilinen kaynaklar hatası: ${error.message}`);
    return [];
  }
};

/**
 * Belirli bir URL'den içerik çeker (retry mekanizması ile)
 */
export const scrapeUrl = async (url, retries = 2) => {
  try {
    log.info(`URL içeriği çekiliyor: ${url}`);
    
    // Önce Cheerio ile dene (daha hızlı)
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          log.info(`Retry ${attempt}/${retries} için ${url}`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
        }
        
        const response = await axios.get(url, {
          timeout: 20000, // 20 saniye timeout
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Connection': 'keep-alive',
          },
          maxRedirects: 5,
          validateStatus: (status) => status < 500, // 5xx hataları hariç
          httpAgent: new http.Agent({ keepAlive: true }),
          httpsAgent: new https.Agent({ keepAlive: true }),
        });
      
      const $ = cheerio.load(response.data);
      
      // Meta bilgileri çek
      const title = $('title').text().trim() || 
                   $('meta[property="og:title"]').attr('content') ||
                   $('h1').first().text().trim();
      
      // İçerik çek (article, main, veya body'den)
      let content = '';
      const selectors = ['article', 'main', '.content', '#content', 'body'];
      
      for (const selector of selectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          content = element.text().trim();
          if (content.length > 100) break; // Yeterli içerik bulundu
        }
      }
      
      // Eğer içerik bulunamazsa, tüm paragrafları birleştir
      if (content.length < 100) {
        content = $('p').map((i, el) => $(el).text().trim()).get().join(' ');
      }
      
      // Metadata
      const description = $('meta[name="description"]').attr('content') ||
                         $('meta[property="og:description"]').attr('content') || '';
      
      const imageUrl = $('meta[property="og:image"]').attr('content') ||
                      $('img').first().attr('src') || '';
      
      // Tarih bilgisi (varsa)
      const publishDate = $('meta[property="article:published_time"]').attr('content') ||
                         $('time').first().attr('datetime') || null;
      
        // Başarılı response kontrolü
        if (response.status >= 400) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return {
          title: title || 'Başlık bulunamadı',
          content: content || 'İçerik bulunamadı',
          url,
          metadata: {
            description,
            imageUrl,
            publishDate: publishDate ? new Date(publishDate) : null,
          },
          source: new URL(url).hostname,
        };
        
      } catch (axiosError) {
        // Son deneme değilse devam et
        if (attempt < retries) {
          log.warn(`Cheerio denemesi ${attempt + 1} başarısız: ${axiosError.message}`);
          continue;
        }
        
        // Tüm denemeler başarısız oldu, Puppeteer dene
        log.warn(`Cheerio başarısız (${retries + 1} deneme), Puppeteer deneniyor: ${url}`);
        return await scrapeUrlWithPuppeteer(url, retries);
      }
    }
    
  } catch (error) {
    log.error(`URL scraping hatası (${url}): ${error.message}`);
    return null;
  }
};

/**
 * Puppeteer ile dinamik içerik çeker (retry mekanizması ile)
 */
const scrapeUrlWithPuppeteer = async (url, retries = 2) => {
  let browser = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        log.info(`Puppeteer retry ${attempt}/${retries} için ${url}`);
        await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
      }
      
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
        timeout: 30000,
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Request interception ekle (gereksiz kaynakları engelle - daha hızlı)
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', // networkidle2 yerine daha hızlı
        timeout: 30000 
      });
      
      // Sayfanın yüklenmesi için kısa bir bekleme
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const content = await page.evaluate(() => {
        const title = document.querySelector('title')?.innerText || 
                     document.querySelector('h1')?.innerText || '';
        
        const article = document.querySelector('article') || 
                       document.querySelector('main') ||
                       document.querySelector('.content') ||
                       document.querySelector('body');
        
        const content = article?.innerText || '';
        
        return { title, content };
      });
      
      await browser.close();
      browser = null;
      
      return {
        title: content.title || 'Başlık bulunamadı',
        content: content.content || 'İçerik bulunamadı',
        url,
        source: new URL(url).hostname,
        metadata: {},
      };
      
    } catch (error) {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          // Ignore close errors
        }
        browser = null;
      }
      
      // Son deneme değilse devam et
      if (attempt < retries) {
        log.warn(`Puppeteer denemesi ${attempt + 1} başarısız: ${error.message}`);
        continue;
      }
      
      // Tüm denemeler başarısız
      log.error(`Puppeteer scraping hatası (${url}) - ${retries + 1} deneme başarısız: ${error.message}`);
      return null;
    }
  }
  
  return null;
};

/**
 * Ana scraping fonksiyonu - Arama yapar ve içerikleri çeker
 */
export const scrapeGTUData = async (
  query = 'Gebze Teknik Üniversitesi', 
  maxResults = 5,
  options = {}
) => {
  try {
    log.info('=== GTU Web Scraping Başlatılıyor ===');
    log.info(`Arama sorgusu: "${query}"`);
    log.info(`Maksimum sonuç: ${maxResults}`);
    
    // Eğer çoklu arama isteniyorsa
    if (options.wideSearch) {
      const { searchMultipleQueries, generateGTUQueries } = await import('./searchService.js');
      const queries = options.customQueries || generateGTUQueries(query);
      const searchResults = await searchMultipleQueries(
        queries,
        options.maxResultsPerQuery || 5,
        maxResults
      );
      return await processSearchResults(searchResults, maxResults);
    }
    
    // 1. Web araması yap (tek sorgu)
    const searchResults = await searchWeb(query, maxResults);
    
    return await processSearchResults(searchResults, maxResults);
    
  } catch (error) {
    log.error(`Scraping hatası: ${error.message}`);
    throw error;
  }
};

/**
 * Arama sonuçlarını işler ve içerikleri çeker
 */
export const processSearchResults = async (searchResults, maxResults) => {
  if (searchResults.length === 0) {
    log.warn('Hiç arama sonucu bulunamadı!');
    return [];
  }
  
  log.info(`\n${searchResults.length} arama sonucu bulundu:\n`);
  searchResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.title}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Snippet: ${result.snippet?.substring(0, 100)}...`);
    if (result.searchQuery) {
      console.log(`   Sorgu: ${result.searchQuery}`);
    }
    console.log('');
  });
  
  // 2. Her URL'den içerik çek
  log.info('\n=== URL içerikleri çekiliyor ===\n');
  const scrapedData = [];
  
  for (let i = 0; i < searchResults.length && scrapedData.length < maxResults; i++) {
    const result = searchResults[i];
    log.info(`[${i + 1}/${searchResults.length}] İşleniyor: ${result.url}`);
    
    const data = await scrapeUrl(result.url);
    
    if (data && data.content && data.content.length > 50) {
      scrapedData.push({
        ...data,
        searchSnippet: result.snippet,
        searchQuery: result.searchQuery || null,
      });
      
      // Console'a yazdır
      console.log(`\n✓ Başarılı: ${data.title}`);
      console.log(`  İçerik uzunluğu: ${data.content.length} karakter`);
      console.log(`  Kaynak: ${data.source}\n`);
    } else {
      log.warn(`✗ İçerik çekilemedi veya yetersiz: ${result.url}`);
    }
    
    // Rate limiting - her istek arasında bekle
    if (i < searchResults.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye bekle
    }
  }
  
  log.info(`\n=== Scraping Tamamlandı ===`);
  log.info(`Toplam ${scrapedData.length} veri çekildi\n`);
  
  // Tüm sonuçları console'a yazdır
  console.log('\n=== ÇEKİLEN VERİLER ===\n');
  scrapedData.forEach((data, index) => {
    console.log(`\n[${index + 1}] ${data.title}`);
    console.log(`URL: ${data.url}`);
    console.log(`Kaynak: ${data.source}`);
    if (data.searchQuery) {
      console.log(`Arama Sorgusu: ${data.searchQuery}`);
    }
    console.log(`İçerik (ilk 200 karakter): ${data.content.substring(0, 200)}...`);
    console.log('---');
  });
  
  return scrapedData;
};

