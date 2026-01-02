import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { log } from '../utils/logger.js';
import http from 'http';
import https from 'https';

/**
 * URL'nin içerik çekilebilir bir sayfa olup olmadığını kontrol eder
 */
const isContentPage = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    
    // Resim dosyaları
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp'];
    if (imageExtensions.some(ext => pathname.endsWith(ext))) {
      return false;
    }
    
    // Diğer dosya türleri
    const fileExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar', '.exe', '.dmg'];
    if (fileExtensions.some(ext => pathname.endsWith(ext))) {
      return false;
    }
    
    // JavaScript, CSS gibi dosyalar
    if (pathname.endsWith('.js') || pathname.endsWith('.css')) {
      return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * URL'nin GTU domain'i içinde olup olmadığını kontrol eder
 */
const isGTUDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('gtu.edu.tr');
  } catch (e) {
    return false;
  }
};

/**
 * Metni temizler (classification için)
 */
const cleanText = (text) => {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ') // Çoklu boşlukları tek boşluğa çevir
    .replace(/\n+/g, ' ') // Yeni satırları boşluğa çevir
    .trim();
};

/**
 * Yapılandırılmış içerik çeker (retry yok)
 */
export const extractStructuredContent = async (url) => {
  try {
    // İçerik çekilebilir bir sayfa mı kontrol et
    if (!isContentPage(url)) {
      log.warn(`İçerik çekilemez sayfa türü: ${url}`);
      return null;
    }
    
    log.info(`Yapılandırılmış içerik çekiliyor: ${url}`);
    
    // Cheerio ile dene (retry yok)
    try {
      const response = await axios.get(url, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Connection': 'keep-alive',
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
        httpAgent: new http.Agent({ keepAlive: true }),
        httpsAgent: new https.Agent({ keepAlive: true }),
      });
      
      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
        
        const $ = cheerio.load(response.data);
        
        // Gereksiz elementleri kaldır
        $('script, style, noscript, iframe, embed, object').remove();
        
        // Yapılandırılmış içerik çıkar
        const structuredContent = {
          headers: [],
          paragraphs: [],
          links: [],
          images: [],
          lists: [],
        };
        
        let order = 0;
        
        // Headers (h1-h6)
        $('h1, h2, h3, h4, h5, h6').each((i, element) => {
          const $el = $(element);
          const text = cleanText($el.text());
          if (text && text.length > 0) {
            const level = parseInt(element.tagName.charAt(1));
            structuredContent.headers.push({
              level,
              text,
              order: order++,
            });
          }
        });
        
        // Paragraphs
        $('p, div.content, div.text, article p, main p').each((i, element) => {
          const $el = $(element);
          const text = cleanText($el.text());
          // Çok kısa paragrafları atla (muhtemelen navigasyon)
          if (text && text.length > 20) {
            structuredContent.paragraphs.push({
              text,
              order: order++,
            });
          }
        });
        
        // Links
        $('a[href]').each((i, element) => {
          const $el = $(element);
          const href = $el.attr('href');
          const linkText = cleanText($el.text());
          
          if (href && !href.startsWith('#')) {
            try {
              let absoluteUrl = href;
              if (!href.startsWith('http://') && !href.startsWith('https://')) {
                absoluteUrl = new URL(href, url).href;
              }
              
              structuredContent.links.push({
                text: linkText || absoluteUrl,
                url: absoluteUrl,
                isInternal: isGTUDomain(absoluteUrl),
                order: order++,
              });
            } catch (e) {
              // Invalid URL, skip
            }
          }
        });
        
        // Images
        $('img[src]').each((i, element) => {
          const $el = $(element);
          const src = $el.attr('src');
          const alt = $el.attr('alt') || '';
          
          if (src && !src.startsWith('data:')) {
            try {
              let absoluteUrl = src;
              if (!src.startsWith('http://') && !src.startsWith('https://')) {
                absoluteUrl = new URL(src, url).href;
              }
              
              // Sadece içerik çekilebilir resimler (büyük resimler, içerik resimleri)
              // Küçük icon'ları ve logo'ları atla
              if (!src.includes('icon') && !src.includes('logo') && !src.includes('button')) {
                structuredContent.images.push({
                  alt: cleanText(alt),
                  src: absoluteUrl,
                  order: order++,
                });
              }
            } catch (e) {
              // Invalid URL, skip
            }
          }
        });
        
        // Lists
        $('ul, ol').each((i, element) => {
          const $el = $(element);
          const items = [];
          
          $el.find('li').each((j, li) => {
            const text = cleanText($(li).text());
            if (text && text.length > 0) {
              items.push(text);
            }
          });
          
          if (items.length > 0) {
            structuredContent.lists.push({
              type: element.tagName.toLowerCase() === 'ol' ? 'ordered' : 'unordered',
              items,
              order: order++,
            });
          }
        });
        
        // Clean text oluştur (classification için)
        const allTexts = [
          ...structuredContent.headers.map(h => h.text),
          ...structuredContent.paragraphs.map(p => p.text),
          ...structuredContent.lists.flatMap(l => l.items),
        ];
        
        const cleanTextContent = allTexts
          .filter(text => text && text.length > 0)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Word count
        const wordCount = cleanTextContent.split(/\s+/).filter(w => w.length > 0).length;
        
        // Eğer yeterli içerik yoksa null döndür
        if (wordCount < 10) {
          log.warn(`Yetersiz içerik (${wordCount} kelime): ${url}`);
          return null;
        }
        
        return {
          ...structuredContent,
          cleanText: cleanTextContent,
          wordCount,
          language: 'tr', // Varsayılan, daha sonra language detection eklenebilir
        };
        
    } catch (axiosError) {
      // Cheerio başarısız oldu, Puppeteer dene (retry yok)
      log.warn(`Cheerio başarısız, Puppeteer deneniyor: ${url}`);
      return await extractStructuredContentWithPuppeteer(url);
    }
    
  } catch (error) {
    log.error(`Yapılandırılmış içerik çekme hatası (${url}): ${error.message}`);
    return null;
  }
};

/**
 * Puppeteer ile yapılandırılmış içerik çeker (retry yok)
 */
const extractStructuredContentWithPuppeteer = async (url) => {
  let browser = null;
  
  try {
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
      
      // Request interception
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
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await page.evaluate((baseUrl) => {
        const cleanText = (text) => {
          if (!text) return '';
          return text.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim();
        };
        
        const isGTUDomain = (url) => {
          try {
            return new URL(url).hostname.includes('gtu.edu.tr');
          } catch (e) {
            return false;
          }
        };
        
        const structuredContent = {
          headers: [],
          paragraphs: [],
          links: [],
          images: [],
          lists: [],
        };
        
        let order = 0;
        
        // Headers
        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
          const text = cleanText(el.innerText);
          if (text && text.length > 0) {
            const level = parseInt(el.tagName.charAt(1));
            structuredContent.headers.push({ level, text, order: order++ });
          }
        });
        
        // Paragraphs
        document.querySelectorAll('p, div.content, div.text, article p, main p').forEach((el) => {
          const text = cleanText(el.innerText);
          if (text && text.length > 20) {
            structuredContent.paragraphs.push({ text, order: order++ });
          }
        });
        
        // Links
        document.querySelectorAll('a[href]').forEach((el) => {
          const href = el.getAttribute('href');
          const linkText = cleanText(el.innerText);
          
          if (href && !href.startsWith('#')) {
            try {
              let absoluteUrl = href;
              if (!href.startsWith('http://') && !href.startsWith('https://')) {
                absoluteUrl = new URL(href, baseUrl).href;
              }
              
              structuredContent.links.push({
                text: linkText || absoluteUrl,
                url: absoluteUrl,
                isInternal: isGTUDomain(absoluteUrl),
                order: order++,
              });
            } catch (e) {
              // Skip
            }
          }
        });
        
        // Images
        document.querySelectorAll('img[src]').forEach((el) => {
          const src = el.getAttribute('src');
          const alt = el.getAttribute('alt') || '';
          
          if (src && !src.startsWith('data:') && !src.includes('icon') && !src.includes('logo')) {
            try {
              let absoluteUrl = src;
              if (!src.startsWith('http://') && !src.startsWith('https://')) {
                absoluteUrl = new URL(src, baseUrl).href;
              }
              
              structuredContent.images.push({
                alt: cleanText(alt),
                src: absoluteUrl,
                order: order++,
              });
            } catch (e) {
              // Skip
            }
          }
        });
        
        // Lists
        document.querySelectorAll('ul, ol').forEach((el) => {
          const items = [];
          el.querySelectorAll('li').forEach((li) => {
            const text = cleanText(li.innerText);
            if (text && text.length > 0) {
              items.push(text);
            }
          });
          
          if (items.length > 0) {
            structuredContent.lists.push({
              type: el.tagName.toLowerCase() === 'ol' ? 'ordered' : 'unordered',
              items,
              order: order++,
            });
          }
        });
        
        // Clean text
        const allTexts = [
          ...structuredContent.headers.map(h => h.text),
          ...structuredContent.paragraphs.map(p => p.text),
          ...structuredContent.lists.flatMap(l => l.items),
        ];
        
        const cleanTextContent = allTexts
          .filter(text => text && text.length > 0)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        const wordCount = cleanTextContent.split(/\s+/).filter(w => w.length > 0).length;
        
        return {
          ...structuredContent,
          cleanText: cleanTextContent,
          wordCount,
        };
      }, url);
      
      await browser.close();
      browser = null;
      
      if (result.wordCount < 10) {
        log.warn(`Yetersiz içerik (${result.wordCount} kelime): ${url}`);
        return null;
      }
      
      return {
        ...result,
        language: 'tr',
      };
      
    } catch (error) {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          // Ignore
        }
        browser = null;
      }
      
      log.error(`Puppeteer scraping hatası (${url}): ${error.message}`);
      return null;
    }
};

