import express from 'express';
import {
  startScraping,
  getScrapingStatus,
  getScrapingResults,
  testScraping,
  searchUrls, // 1. Aşama
  scrapeContentFromUrls, // 2. Aşama
  analyzeDomains, // Domain analizi (tek sayfa)
  discoverGTU, // Recursive GTU keşfi
  testScrapeContent, // İçerik çekme testi
} from '../controllers/scrapingController.js';

const router = express.Router();

// ============================================
// ADIM ADIM SCRAPING ENDPOINT'LERİ
// ============================================

// GET /api/scrape/search - 1. AŞAMA: Sadece URL'leri bul (DB'ye kaydetme)
router.get('/search', searchUrls);

// GET /api/scrape/content/test - Test: İçerik çekilmemiş URL'lerden içerik çek (console output)
router.get('/content/test', testScrapeContent);

// POST /api/scrape/content - 2. AŞAMA: URL'lerden içerik çek ve DB'ye kaydet
router.post('/content', scrapeContentFromUrls);

// GET /api/scrape/domains - Domain ve subdomain analizi (tek sayfa)
router.get('/domains', analyzeDomains);

// GET /api/scrape/discover - Recursive GTU sayfa keşfi (GTU domain'indeki tüm sayfaları keşfeder)
router.get('/discover', discoverGTU);

// ============================================
// ESKİ ENDPOINT'LER (Backward compatibility)
// ============================================

// GET /api/scrape/test - Test scraping (console output)
router.get('/test', testScraping);

// POST /api/scrape - Start new scraping
router.post('/', startScraping);

// GET /api/scrape/status/:id - Get scraping status
router.get('/status/:id', getScrapingStatus);

// GET /api/scrape/results/:id - Get scraping results
router.get('/results/:id', getScrapingResults);

export default router;

