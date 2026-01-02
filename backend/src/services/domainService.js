import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { log } from '../utils/logger.js';
import http from 'http';
import https from 'https';

/**
 * Bir URL'den tüm domain ve subdomain'leri çıkarır
 */
export const extractDomainsFromUrl = async (url) => {
  try {
    log.info(`Domain analizi başlatılıyor: ${url}`);
    
    const domains = new Set();
    const subdomains = new Set();
    const allUrls = new Set();
    
    // Önce Cheerio ile dene
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
        httpAgent: new http.Agent({ keepAlive: true }),
        httpsAgent: new https.Agent({ keepAlive: true }),
      });
      
      const $ = cheerio.load(response.data);
      
      // Tüm linkleri bul (a, link, script, img, iframe, source, etc.)
      const selectors = [
        'a[href]',
        'link[href]',
        'script[src]',
        'img[src]',
        'iframe[src]',
        'source[src]',
        'video[src]',
        'audio[src]',
        'embed[src]',
        'object[data]',
        'form[action]',
      ];
      
      selectors.forEach(selector => {
        $(selector).each((i, element) => {
          const $el = $(element);
          let urlAttr = $el.attr('href') || 
                       $el.attr('src') || 
                       $el.attr('data') || 
                       $el.attr('action');
          
          if (urlAttr) {
            urlAttr = urlAttr.trim();
            
            // Absolute URL'leri işle
            if (urlAttr.startsWith('http://') || urlAttr.startsWith('https://')) {
              allUrls.add(urlAttr);
              try {
                const urlObj = new URL(urlAttr);
                const hostname = urlObj.hostname;
                
                // Domain ve subdomain'i ayır
                const parts = hostname.split('.');
                if (parts.length >= 2) {
                  const domain = parts.slice(-2).join('.'); // example.com
                  const subdomain = parts.length > 2 ? parts.slice(0, -2).join('.') : '';
                  
                  domains.add(domain);
                  if (subdomain) {
                    subdomains.add(`${subdomain}.${domain}`);
                  } else {
                    subdomains.add(domain); // Ana domain de subdomain listesine ekle
                  }
                }
              } catch (e) {
                // Invalid URL, skip
              }
            }
            // Relative URL'leri base URL ile birleştir
            else if (urlAttr.startsWith('/') || urlAttr.startsWith('./') || !urlAttr.startsWith('#')) {
              try {
                const baseUrl = new URL(url);
                const absoluteUrl = new URL(urlAttr, baseUrl).href;
                allUrls.add(absoluteUrl);
                
                const urlObj = new URL(absoluteUrl);
                const hostname = urlObj.hostname;
                
                const parts = hostname.split('.');
                if (parts.length >= 2) {
                  const domain = parts.slice(-2).join('.');
                  const subdomain = parts.length > 2 ? parts.slice(0, -2).join('.') : '';
                  
                  domains.add(domain);
                  if (subdomain) {
                    subdomains.add(`${subdomain}.${domain}`);
                  } else {
                    subdomains.add(domain);
                  }
                }
              } catch (e) {
                // Invalid URL, skip
              }
            }
          }
        });
      });
      
      // Meta tag'lerden de URL'leri çek
      $('meta[property="og:url"], meta[property="og:image"], meta[name="twitter:image"]').each((i, element) => {
        const $el = $(element);
        const content = $el.attr('content');
        if (content && (content.startsWith('http://') || content.startsWith('https://'))) {
          allUrls.add(content);
          try {
            const urlObj = new URL(content);
            const hostname = urlObj.hostname;
            const parts = hostname.split('.');
            if (parts.length >= 2) {
              const domain = parts.slice(-2).join('.');
              const subdomain = parts.length > 2 ? parts.slice(0, -2).join('.') : '';
              
              domains.add(domain);
              if (subdomain) {
                subdomains.add(`${subdomain}.${domain}`);
              } else {
                subdomains.add(domain);
              }
            }
          } catch (e) {
            // Skip
          }
        }
      });
      
    } catch (cheerioError) {
      // Cheerio başarısız olursa Puppeteer kullan
      log.warn(`Cheerio başarısız, Puppeteer deneniyor: ${url}`);
      return await extractDomainsWithPuppeteer(url);
    }
    
    // Sonuçları düzenle
    const domainList = Array.from(domains).sort();
    const subdomainList = Array.from(subdomains).sort();
    const urlList = Array.from(allUrls).slice(0, 100); // İlk 100 URL
    
    log.info(`${domainList.length} unique domain, ${subdomainList.length} unique subdomain bulundu`);
    
    return {
      baseUrl: url,
      domains: domainList,
      subdomains: subdomainList,
      totalUrls: allUrls.size,
      sampleUrls: urlList,
    };
    
  } catch (error) {
    log.error(`Domain analizi hatası (${url}): ${error.message}`);
    throw error;
  }
};

/**
 * Puppeteer ile domain analizi
 */
const extractDomainsWithPuppeteer = async (url) => {
  let browser = null;
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
      timeout: 30000,
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Request interception - sadece HTML almak için
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
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = await page.evaluate((baseUrl) => {
      const domains = new Set();
      const subdomains = new Set();
      const allUrls = new Set();
      
      // Tüm linkleri bul
      const links = document.querySelectorAll('a[href], link[href], script[src], img[src], iframe[src], source[src], video[src], audio[src], embed[src], object[data], form[action]');
      
      links.forEach(link => {
        let urlAttr = link.href || link.src || link.data || link.action;
        
        if (urlAttr) {
          try {
            let absoluteUrl;
            if (urlAttr.startsWith('http://') || urlAttr.startsWith('https://')) {
              absoluteUrl = urlAttr;
            } else {
              absoluteUrl = new URL(urlAttr, baseUrl).href;
            }
            
            allUrls.add(absoluteUrl);
            const urlObj = new URL(absoluteUrl);
            const hostname = urlObj.hostname;
            
            const parts = hostname.split('.');
            if (parts.length >= 2) {
              const domain = parts.slice(-2).join('.');
              const subdomain = parts.length > 2 ? parts.slice(0, -2).join('.') : '';
              
              domains.add(domain);
              if (subdomain) {
                subdomains.add(`${subdomain}.${domain}`);
              } else {
                subdomains.add(domain);
              }
            }
          } catch (e) {
            // Skip invalid URLs
          }
        }
      });
      
      // Meta tags
      const metaTags = document.querySelectorAll('meta[property], meta[name]');
      metaTags.forEach(meta => {
        const content = meta.content;
        if (content && (content.startsWith('http://') || content.startsWith('https://'))) {
          try {
            allUrls.add(content);
            const urlObj = new URL(content);
            const hostname = urlObj.hostname;
            
            const parts = hostname.split('.');
            if (parts.length >= 2) {
              const domain = parts.slice(-2).join('.');
              const subdomain = parts.length > 2 ? parts.slice(0, -2).join('.') : '';
              
              domains.add(domain);
              if (subdomain) {
                subdomains.add(`${subdomain}.${domain}`);
              } else {
                subdomains.add(domain);
              }
            }
          } catch (e) {
            // Skip
          }
        }
      });
      
      return {
        domains: Array.from(domains),
        subdomains: Array.from(subdomains),
        totalUrls: allUrls.size,
        sampleUrls: Array.from(allUrls).slice(0, 100),
      };
    }, url);
    
    await browser.close();
    
    return {
      baseUrl: url,
      domains: result.domains.sort(),
      subdomains: result.subdomains.sort(),
      totalUrls: result.totalUrls,
      sampleUrls: result.sampleUrls,
    };
    
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore
      }
    }
    throw error;
  }
};

/**
 * Recursive olarak GTU domain'indeki tüm sayfaları keşfeder
 */
export const discoverGTUPages = async (startUrl = 'https://www.gtu.edu.tr/en', maxDepth = 2, maxPages = 50) => {
  try {
    log.info('=== GTU Recursive Sayfa Keşfi Başlatılıyor ===');
    log.info(`Başlangıç URL: ${startUrl}`);
    log.info(`Maksimum derinlik: ${maxDepth}`);
    log.info(`Maksimum sayfa: ${maxPages}`);
    
    const visitedUrls = new Set();
    const allDomains = new Set();
    const allSubdomains = new Set();
    const allUrls = new Set();
    const gtuUrls = new Set(); // Sadece GTU domain'indeki URL'ler
    
    const queue = [{ url: startUrl, depth: 0 }];
    
    while (queue.length > 0 && visitedUrls.size < maxPages) {
      const { url, depth } = queue.shift();
      
      // Zaten ziyaret edildiyse atla
      if (visitedUrls.has(url)) {
        continue;
      }
      
      // Maksimum derinliği aştıysa atla
      if (depth > maxDepth) {
        continue;
      }
      
      // Sadece GTU domain'indeki sayfaları işle
      try {
        const urlObj = new URL(url);
        if (!urlObj.hostname.includes('gtu.edu.tr')) {
          continue;
        }
      } catch (e) {
        continue;
      }
      
      log.info(`[Derinlik ${depth}] İşleniyor: ${url}`);
      visitedUrls.add(url);
      
      try {
        // Sayfayı analiz et
        const pageResult = await extractDomainsFromUrl(url);
        
        // Domain ve subdomain'leri topla
        pageResult.domains.forEach(d => allDomains.add(d));
        pageResult.subdomains.forEach(s => allSubdomains.add(s));
        pageResult.sampleUrls.forEach(u => allUrls.add(u));
        
        // GTU domain'indeki URL'leri bul ve queue'ya ekle
        pageResult.sampleUrls.forEach(foundUrl => {
          try {
            const foundUrlObj = new URL(foundUrl);
            
            // GTU domain'i kontrolü
            if (foundUrlObj.hostname.includes('gtu.edu.tr')) {
              gtuUrls.add(foundUrl);
              
              // Eğer henüz ziyaret edilmediyse ve derinlik limiti içindeyse queue'ya ekle
              if (!visitedUrls.has(foundUrl) && depth < maxDepth) {
                queue.push({ url: foundUrl, depth: depth + 1 });
              }
            }
          } catch (e) {
            // Invalid URL, skip
          }
        });
        
        // Rate limiting - her sayfa arasında bekle
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        log.warn(`Sayfa analizi hatası (${url}): ${error.message}`);
        continue;
      }
    }
    
    // Sonuçları düzenle
    const domainList = Array.from(allDomains).sort();
    const subdomainList = Array.from(allSubdomains).sort();
    const gtuUrlList = Array.from(gtuUrls).sort();
    const visitedUrlList = Array.from(visitedUrls);
    
    log.info(`\n✓ Keşif tamamlandı:`);
    log.info(`  - Ziyaret edilen sayfa: ${visitedUrlList.length}`);
    log.info(`  - Bulunan GTU URL: ${gtuUrlList.length}`);
    log.info(`  - Unique domain: ${domainList.length}`);
    log.info(`  - Unique subdomain: ${subdomainList.length}`);
    
    // Console'a yazdır
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('        GTU RECURSIVE SAYFA KEŞFİ SONUÇLARI');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log(`📊 Başlangıç URL: ${startUrl}`);
    console.log(`📈 Ziyaret Edilen Sayfa: ${visitedUrlList.length}`);
    console.log(`🔗 Bulunan GTU URL: ${gtuUrlList.length}`);
    console.log(`🌐 Unique Domain: ${domainList.length}`);
    console.log(`🔗 Unique Subdomain: ${subdomainList.length}\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('              ZİYARET EDİLEN SAYFALAR');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    visitedUrlList.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('              BULUNAN GTU URL\'LERİ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    gtuUrlList.slice(0, 50).forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
    
    if (gtuUrlList.length > 50) {
      console.log(`\n... ve ${gtuUrlList.length - 50} URL daha`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('                    DOMAİNLER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    domainList.forEach((domain, index) => {
      console.log(`${index + 1}. ${domain}`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('                  SUBDOMAİNLER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    subdomainList.forEach((subdomain, index) => {
      console.log(`${index + 1}. ${subdomain}`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════\n');
    
    return {
      startUrl,
      visitedPages: visitedUrlList,
      gtuUrls: gtuUrlList,
      domains: domainList,
      subdomains: subdomainList,
      totalGtuUrls: gtuUrlList.length,
      totalVisited: visitedUrlList.length,
    };
    
  } catch (error) {
    log.error(`GTU recursive keşif hatası: ${error.message}`);
    throw error;
  }
};

/**
 * GTU ana sayfasından tüm domain ve subdomain'leri çıkarır
 */
export const extractGTUDomains = async () => {
  try {
    log.info('=== GTU Domain Analizi Başlatılıyor ===');
    
    const gtuUrl = 'https://www.gtu.edu.tr/en';
    const result = await extractDomainsFromUrl(gtuUrl);
    
    // Console'a yazdır
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('           GTU DOMAIN VE SUBDOMAIN ANALİZİ');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log(`📊 Analiz Edilen URL: ${result.baseUrl}`);
    console.log(`📈 Toplam URL Sayısı: ${result.totalUrls}`);
    console.log(`🌐 Unique Domain Sayısı: ${result.domains.length}`);
    console.log(`🔗 Unique Subdomain Sayısı: ${result.subdomains.length}\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('                    DOMAİNLER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    result.domains.forEach((domain, index) => {
      console.log(`${index + 1}. ${domain}`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('                  SUBDOMAİNLER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    result.subdomains.forEach((subdomain, index) => {
      console.log(`${index + 1}. ${subdomain}`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('              ÖRNEK URL\'LER (İlk 20)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    result.sampleUrls.slice(0, 20).forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════\n');
    
    return result;
    
  } catch (error) {
    log.error(`GTU domain analizi hatası: ${error.message}`);
    throw error;
  }
};

