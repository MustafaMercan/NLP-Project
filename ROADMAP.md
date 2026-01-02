# Gebze Teknik Üniversitesi NLP Web Scraping Projesi - Roadmap

## 📋 Proje Özeti
Gebze Teknik Üniversitesi ile ilgili web scraping yaparak verileri toplayan, NLP metodlarıyla sınıflandıran ve React UI üzerinden görüntüleyen bir full-stack uygulama.

## 🛠️ Teknoloji Stack

### Backend
- **Node.js** (Express.js framework)
- **MongoDB** (Mongoose ODM)
- **Web Scraping**: 
  - Cheerio (HTML parsing)
  - Puppeteer (Dynamic content için)
  - Axios (HTTP requests)
- **NLP**: 
  - Natural (Node.js NLP kütüphanesi)
  - TensorFlow.js (Gelişmiş NLP için opsiyonel)
  - Sentiment analysis, keyword extraction, text classification

### Frontend
- **React** (Create React App veya Vite)
- **UI Framework**: Material-UI veya Tailwind CSS
- **State Management**: React Context API veya Redux
- **HTTP Client**: Axios

### Database
- **MongoDB** (NoSQL)
- **Collections**:
  - `scraped_data`: Ham scraping verileri
  - `classified_data`: NLP ile sınıflandırılmış veriler
  - `search_history`: Arama geçmişi

## 📁 Proje Yapısı

```
nlp-node/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── scrapingController.js
│   │   │   ├── nlpController.js
│   │   │   └── dataController.js
│   │   ├── models/
│   │   │   ├── ScrapedData.js
│   │   │   ├── ClassifiedData.js
│   │   │   └── SearchHistory.js
│   │   ├── routes/
│   │   │   ├── scrapingRoutes.js
│   │   │   ├── nlpRoutes.js
│   │   │   └── dataRoutes.js
│   │   ├── services/
│   │   │   ├── scraperService.js
│   │   │   ├── nlpService.js
│   │   │   └── searchService.js
│   │   ├── utils/
│   │   │   └── logger.js
│   │   └── app.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── ClassificationResults.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Search.jsx
│   │   │   └── Results.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── DataContext.jsx
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
├── scraper/ (Opsiyonel - Python gerekirse)
│   ├── scraper.py
│   └── requirements.txt
├── .gitignore
└── README.md
```

## 🗺️ Geliştirme Aşamaları

### Faz 1: Proje Kurulumu ve Temel Yapı
1. **Backend Kurulumu**
   - Node.js projesi oluşturma
   - Express.js kurulumu
   - MongoDB bağlantısı
   - Temel route yapısı
   - Environment variables (.env)

2. **Frontend Kurulumu**
   - React projesi oluşturma
   - Temel component yapısı
   - API servis katmanı
   - Routing yapısı

3. **Database Schema Tasarımı**
   - ScrapedData modeli
   - ClassifiedData modeli
   - SearchHistory modeli

### Faz 2: Web Scraping Implementasyonu
1. **Scraper Service Geliştirme**
   - Google/Bing arama API entegrasyonu
   - Gebze Teknik Üniversitesi ile ilgili arama
   - Cheerio ile HTML parsing
   - Puppeteer ile dinamik içerik scraping
   - Veri temizleme ve normalleştirme

2. **Scraping Controller & Routes**
   - POST /api/scrape - Yeni scraping başlatma
   - GET /api/scrape/status/:id - Scraping durumu
   - GET /api/scrape/results/:id - Scraping sonuçları

3. **Veri Saklama**
   - MongoDB'ye ham veri kaydetme
   - Duplicate kontrolü
   - Metadata ekleme (tarih, kaynak URL, vb.)

### Faz 3: NLP Sınıflandırma
1. **NLP Service Geliştirme**
   - Metin preprocessing (tokenization, stemming)
   - Keyword extraction
   - Sentiment analysis
   - Text classification (kategoriler: haber, akademik, etkinlik, vb.)
   - Entity recognition (isimler, yerler, tarihler)

2. **Sınıflandırma Kategorileri**
   - Haberler
   - Akademik Duyurular
   - Etkinlikler
   - Araştırma Projeleri
   - Öğrenci Duyuruları
   - Diğer

3. **NLP Controller & Routes**
   - POST /api/nlp/classify - Veri sınıflandırma
   - GET /api/nlp/categories - Kategoriler
   - GET /api/nlp/stats - İstatistikler

### Faz 4: API ve Backend Tamamlama
1. **Data Controller & Routes**
   - GET /api/data - Tüm sınıflandırılmış veriler
   - GET /api/data/:id - Tekil veri detayı
   - GET /api/data/search?query=... - Arama
   - GET /api/data/filter?category=... - Kategori filtreleme
   - GET /api/data/stats - Genel istatistikler

2. **Error Handling & Validation**
   - Middleware'ler
   - Error response formatları
   - Input validation

3. **Rate Limiting & Security**
   - API rate limiting
   - CORS ayarları
   - Security headers

### Faz 5: Frontend Geliştirme
1. **UI Components**
   - SearchBar: Arama yapma
   - DataTable: Verileri tablo formatında gösterme
   - ClassificationResults: Sınıflandırma sonuçları
   - Dashboard: Genel istatistikler ve grafikler
   - Filters: Kategori, tarih filtreleme

2. **Pages**
   - Home: Ana sayfa, dashboard
   - Search: Arama sayfası
   - Results: Sonuçlar sayfası
   - Details: Detay sayfası

3. **State Management**
   - Context API ile global state
   - API çağrıları
   - Loading states
   - Error handling

4. **Styling**
   - Modern ve responsive tasarım
   - Material-UI veya Tailwind CSS
   - Dark mode (opsiyonel)

### Faz 6: Test ve Optimizasyon
1. **Backend Testing**
   - Unit tests
   - Integration tests
   - API endpoint tests

2. **Frontend Testing**
   - Component tests
   - Integration tests

3. **Performance Optimization**
   - Database indexing
   - Caching stratejileri
   - API response optimization
   - Frontend code splitting

4. **Error Handling & Logging**
   - Comprehensive error logging
   - User-friendly error messages

## 📦 Gerekli NPM Paketleri

### Backend
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.0.0",
  "axios": "^1.3.0",
  "cheerio": "^1.0.0-rc.12",
  "puppeteer": "^19.0.0",
  "natural": "^6.0.0",
  "dotenv": "^16.0.0",
  "cors": "^2.8.5",
  "helmet": "^6.0.0",
  "express-rate-limit": "^6.7.0",
  "validator": "^13.9.0"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.8.0",
  "axios": "^1.3.0",
  "@mui/material": "^5.11.0",
  "@mui/icons-material": "^5.11.0",
  "recharts": "^2.5.0"
}
```

## 🔍 Scraping Stratejisi

1. **Arama Motorları**
   - Google Custom Search API veya
   - Bing Search API
   - Arama sorgusu: "Gebze Teknik Üniversitesi" + ek terimler

2. **Hedef Kaynaklar**
   - GTÜ resmi web sitesi
   - Haber siteleri
   - Akademik platformlar
   - Sosyal medya (opsiyonel)

3. **Scraping Yaklaşımı**
   - Önce Cheerio ile statik içerik
   - Gerekirse Puppeteer ile dinamik içerik
   - Rate limiting ve politika uyumu

## 🎯 NLP Sınıflandırma Yaklaşımı

1. **Preprocessing**
   - Tokenization
   - Stop word removal
   - Stemming/Lemmatization
   - Lowercasing

2. **Feature Extraction**
   - TF-IDF
   - Keyword extraction
   - Named Entity Recognition

3. **Classification**
   - Rule-based classification (kategorilere göre keyword matching)
   - Naive Bayes classifier (Natural kütüphanesi)
   - Sentiment scoring

## 🚀 Deployment Planı

1. **Backend**: Heroku, Railway, veya AWS
2. **Frontend**: Vercel, Netlify
3. **Database**: MongoDB Atlas
4. **Environment Variables**: Güvenli şekilde yönetme

## 📝 Notlar

- Web scraping yaparken robots.txt ve rate limiting kurallarına uyulmalı
- API key'ler güvenli şekilde saklanmalı (.env dosyası)
- MongoDB connection pooling kullanılmalı
- Frontend'de pagination implementasyonu
- Responsive design önemli

## ⏱️ Tahmini Süre

- Faz 1: 2-3 gün
- Faz 2: 3-4 gün
- Faz 3: 4-5 gün
- Faz 4: 2-3 gün
- Faz 5: 5-6 gün
- Faz 6: 2-3 gün

**Toplam: ~18-24 gün**

---

Bu roadmap'i takip ederek adım adım projeyi geliştirebiliriz. Hangi fazdan başlamak istersiniz?

