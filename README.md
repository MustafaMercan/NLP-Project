# GTU NLP Web Scraping Projesi

Gebze Teknik Üniversitesi (GTU) web sitesinden veri çekme, yapılandırma ve NLP yöntemleriyle sınıflandırma projesi.

## 📋 İçindekiler

- [Genel Bakış](#genel-bakış)
- [Teknoloji Stack](#teknoloji-stack)
- [Proje Yapısı](#proje-yapısı)
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [API Endpoint'leri](#api-endpointleri)
- [Veritabanı Modelleri](#veritabanı-modelleri)
- [Özellikler](#özellikler)
- [Frontend](#frontend)
- [Geliştirme Notları](#geliştirme-notları)

## 🎯 Genel Bakış

Bu proje, GTU web sitesinden veri çekme, yapılandırma ve NLP (Doğal Dil İşleme) yöntemleriyle sınıflandırma yapan tam kapsamlı bir web uygulamasıdır. Proje üç ana aşamadan oluşur:

1. **Web Scraping**: GTU web sitesinden veri çekme
2. **İçerik Yapılandırma**: Çekilen verileri yapılandırılmış formata dönüştürme
3. **NLP Sınıflandırma**: Metinleri kategorilere ayırma ve sentiment analizi

## 🛠 Teknoloji Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Veritabanı
- **Mongoose** - ODM (Object Data Modeling)
- **Cheerio** - HTML parsing
- **Puppeteer** - Headless browser (dinamik içerik)
- **Natural.js** - NLP kütüphanesi (Naive Bayes, TF-IDF)
- **Axios** - HTTP client

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Material-UI (MUI)** - UI component library
- **Recharts** - Chart/graph library
- **React Router** - Routing
- **Axios** - API client

## 📁 Proje Yapısı

```
nlp-node/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express uygulaması
│   │   ├── config/
│   │   │   └── database.js        # MongoDB bağlantısı
│   │   ├── controllers/
│   │   │   ├── dataController.js  # Veri işlemleri
│   │   │   ├── nlpController.js   # NLP işlemleri
│   │   │   └── scrapingController.js # Scraping işlemleri
│   │   ├── models/
│   │   │   ├── ScrapedData.js     # Ham scraped veri modeli
│   │   │   ├── StructuredContent.js # Yapılandırılmış içerik modeli
│   │   │   ├── ClassifiedData.js  # Sınıflandırılmış veri modeli
│   │   │   └── SearchHistory.js   # Arama geçmişi modeli
│   │   ├── routes/
│   │   │   ├── dataRoutes.js      # Veri endpoint'leri
│   │   │   ├── nlpRoutes.js       # NLP endpoint'leri
│   │   │   └── scrapingRoutes.js  # Scraping endpoint'leri
│   │   ├── services/
│   │   │   ├── scraperService.js  # Web scraping servisi
│   │   │   ├── contentExtractorService.js # İçerik çıkarma servisi
│   │   │   ├── nlpService.js      # NLP servisi
│   │   │   ├── languageDetectionService.js # Dil tespiti
│   │   │   ├── domainService.js   # Domain analizi
│   │   │   └── searchService.js  # Arama servisi
│   │   ├── scripts/
│   │   │   └── migrateUrlsToEn.js # URL normalizasyon scripti
│   │   └── utils/
│   │       └── logger.js          # Logging utility
│   ├── package.json
│   └── env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js          # Axios client
│   │   │   └── index.js           # API fonksiyonları
│   │   ├── components/
│   │   │   └── Layout.jsx         # Ana layout component
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Dashboard sayfası
│   │   │   └── DataList.jsx      # Veri listesi sayfası
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## 🚀 Kurulum

### Gereksinimler
- Node.js (v18 veya üzeri)
- MongoDB (yerel veya MongoDB Atlas)
- npm veya yarn

### Backend Kurulumu

```bash
cd backend
npm install
cp env.example .env
```

`.env` dosyasını düzenleyin:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/gtu-nlp
FRONTEND_URL=http://localhost:5173
```

Backend'i başlatın:
```bash
npm run dev
```

### Frontend Kurulumu

```bash
cd frontend
npm install
```

Frontend'i başlatın:
```bash
npm run dev
```

## 📖 Kullanım

### 1. Web Scraping

#### URL Keşfi (1. Aşama)
```bash
curl "http://localhost:5001/api/scrape/search?query=Gebze%20Teknik%20Üniversitesi&maxResults=10"
```

#### İçerik Çekme (2. Aşama)
```bash
# Test modu (console output)
curl "http://localhost:5001/api/scrape/content/test?limit=10"

# DB'ye kaydetme
curl -X POST "http://localhost:5001/api/scrape/content?limit=10"
```

#### GTU Sayfa Keşfi
```bash
curl "http://localhost:5001/api/scrape/discover?baseUrl=https://www.gtu.edu.tr/en&maxPages=100"
```

### 2. NLP Sınıflandırma

#### Model Eğitimi
```bash
curl -X POST "http://localhost:5001/api/nlp/train"
```

#### Toplu Sınıflandırma
```bash
curl -X POST "http://localhost:5001/api/nlp/classify/batch?limit=500"
```

### 3. Veri Görüntüleme

Frontend'i açın: `http://localhost:5173`

- **Dashboard**: Genel istatistikler ve grafikler
- **Veriler**: Sınıflandırılmış verilerin listesi

## 🔌 API Endpoint'leri

### Veri Endpoint'leri (`/api/data`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/data` | Tüm verileri getir (pagination, filtreleme, sıralama) |
| GET | `/api/data/stats` | İstatistikleri getir |
| GET | `/api/data/:id` | Tek bir veriyi ID ile getir |

**Query Parametreleri:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 10)
- `category`: Kategori filtresi
- `search`: Arama sorgusu
- `sortBy`: Sıralama alanı (`title`, `category`, `confidence`, `scrapedAt`)
- `sortOrder`: Sıralama yönü (`asc`, `desc`)

### Scraping Endpoint'leri (`/api/scrape`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/scrape/search` | Web araması yap ve URL'leri bul |
| GET | `/api/scrape/content/test` | İçerik çekme testi (console output) |
| POST | `/api/scrape/content` | URL'lerden içerik çek ve DB'ye kaydet |
| GET | `/api/scrape/domains` | Domain ve subdomain analizi |
| GET | `/api/scrape/discover` | GTU sayfalarını recursive keşfet |
| POST | `/api/scrape` | Genel scraping başlat |
| GET | `/api/scrape/status/:id` | Scraping durumunu getir |
| GET | `/api/scrape/results/:id` | Scraping sonuçlarını getir |

**Query Parametreleri:**
- `query`: Arama sorgusu
- `maxResults`: Maksimum sonuç sayısı
- `limit`: İşlenecek kayıt sayısı
- `baseUrl`: Başlangıç URL'i
- `maxPages`: Maksimum sayfa sayısı

### NLP Endpoint'leri (`/api/nlp`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/nlp/train` | NLP modellerini eğit |
| POST | `/api/nlp/classify` | Tek bir veriyi sınıflandır |
| POST | `/api/nlp/classify/batch` | Toplu sınıflandırma |
| GET | `/api/nlp/categories` | Kategorileri getir |
| GET | `/api/nlp/stats` | NLP istatistiklerini getir |
| GET | `/api/nlp/debug/db` | Veritabanı durumunu kontrol et |

**Query Parametreleri:**
- `limit`: Toplu işlem için kayıt sayısı

## 🗄 Veritabanı Modelleri

### ScrapedData
Ham scraped verileri saklar.
```javascript
{
  title: String,
  content: String,
  url: String (unique),
  source: String,
  scrapedAt: Date,
  metadata: {
    author: String,
    publishDate: Date,
    tags: [String],
    imageUrl: String
  },
  isClassified: Boolean,
  searchQuery: String
}
```

### StructuredContent
Yapılandırılmış içeriği saklar.
```javascript
{
  scrapedDataId: ObjectId (ref: ScrapedData),
  headers: [{ level: Number, text: String, order: Number }],
  paragraphs: [{ text: String, order: Number }],
  links: [{ text: String, url: String, isInternal: Boolean, order: Number }],
  images: [{ alt: String, src: String, order: Number }],
  lists: [{ type: String, items: [String], order: Number }],
  cleanText: String,
  wordCount: Number,
  language: String
}
```

### ClassifiedData
Sınıflandırılmış verileri saklar.
```javascript
{
  scrapedDataId: ObjectId (ref: ScrapedData),
  category: String,
  confidence: Number (0-1),
  sentiment: String (positive/negative/neutral),
  sentimentScore: Number,
  keywords: [String],
  entities: [String],
  summary: String,
  nlpMetadata: Object
}
```

### SearchHistory
Arama geçmişini saklar.
```javascript
{
  query: String,
  foundUrls: [String],
  scrapedCount: Number,
  createdAt: Date
}
```

## ✨ Özellikler

### Web Scraping
- ✅ DuckDuckGo ve Google arama desteği
- ✅ Cheerio ve Puppeteer ile statik/dinamik içerik çekme
- ✅ Recursive sayfa keşfi
- ✅ Domain ve subdomain analizi
- ✅ URL normalizasyonu (`/en/` formatına)
- ✅ Başarısız URL'lerin otomatik temizlenmesi
- ✅ Retry mekanizması (opsiyonel)

### İçerik İşleme
- ✅ Yapılandırılmış içerik çıkarma (headers, paragraphs, links, images, lists)
- ✅ Temiz metin oluşturma (NLP için)
- ✅ Dil tespiti (Türkçe/İngilizce)
- ✅ Kelime sayısı hesaplama
- ✅ İçerik filtreleme (PDF, resim, JS/CSS dosyaları)

### NLP Sınıflandırma
- ✅ Naive Bayes sınıflandırıcı (Türkçe ve İngilizce için ayrı modeller)
- ✅ Rule-based sınıflandırma
- ✅ Sentiment analizi (positive/negative/neutral)
- ✅ Keyword extraction (TF-IDF)
- ✅ Model persistence (disk'e kaydetme/yükleme)
- ✅ Toplu sınıflandırma

### Kategoriler
- Haberler
- Akademik Duyurular
- Etkinlikler
- Araştırma Projeleri
- Öğrenci Duyuruları
- Diğer

### Frontend
- ✅ Dark theme dashboard
- ✅ İstatistik kartları (8 KPI)
- ✅ Pie charts (kategori ve sentiment dağılımı)
- ✅ Bar chart (kategori bazında detaylı istatistikler)
- ✅ Veri listesi (filtreleme, arama, sıralama)
- ✅ Detay modal
- ✅ Responsive tasarım

## 🎨 Frontend Özellikleri

### Dashboard
- **8 KPI Kartı**: Toplam veri, sınıflandırılmış, sınıflandırılmamış, ortalama güven, toplam kelime, son 24 saat, max güven, sınıflandırma oranı
- **Grafikler**: Kategori dağılımı (pie), sentiment dağılımı (pie), kategori bazında detaylı istatistikler (bar)
- **Listeler**: Son eklenen veriler, en yüksek güven skorları, kategori ortalama güven skorları

### Veriler Sayfası
- **Filtreleme**: Kategori ve arama
- **Sıralama**: Başlık, kategori, güven skoruna göre
- **Pagination**: Sayfa sayfa gezinme
- **Detay Modal**: Satıra tıklayarak detay görüntüleme

## 🔧 Geliştirme Notları

### URL Normalizasyonu
Tüm GTU URL'leri `/en/` formatına normalize edilir:
```bash
npm run migrate:urls        # Dry-run
npm run migrate:urls:execute # Gerçek migration
```

### Model Eğitimi
Modeller `backend/models_cache/` dizinine kaydedilir ve sunucu başlatıldığında otomatik yüklenir.

### CORS
Backend tüm origin'lere izin verir (development için). Production'da `.env` dosyasında `FRONTEND_URL` belirtilmelidir.

### Hata Yönetimi
- Başarısız scraping işlemleri otomatik temizlenir
- Yetersiz içerik (< 10 kelime) filtrelenir
- Timeout ve connection hataları yakalanır

## 📝 Örnek Kullanım Senaryosu

1. **Veri Çekme**:
   ```bash
   # GTU sayfalarını keşfet
   curl "http://localhost:5001/api/scrape/discover?maxPages=50"
   
   # İçerik çek
   curl -X POST "http://localhost:5001/api/scrape/content?limit=100"
   ```

2. **NLP İşlemleri**:
   ```bash
   # Model eğit
   curl -X POST "http://localhost:5001/api/nlp/train"
   
   # Sınıflandır
   curl -X POST "http://localhost:5001/api/nlp/classify/batch?limit=500"
   ```

3. **Veri Görüntüleme**:
   - Frontend'i aç: `http://localhost:5173`
   - Dashboard'da istatistikleri görüntüle
   - Veriler sayfasında filtrele ve sırala

## 🐛 Bilinen Sorunlar

- Node.js v18'de Vite uyarıları (çalışmaya engel değil)
- Bazı dinamik sayfalarda içerik çekme başarısız olabilir
- Büyük veri setlerinde sınıflandırma uzun sürebilir

## 📄 Lisans

ISC

## 👥 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📞 İletişim

Sorularınız için issue açabilirsiniz.

---

**Not**: Bu proje eğitim amaçlı geliştirilmiştir. Production kullanımı için ek güvenlik önlemleri alınmalıdır.

