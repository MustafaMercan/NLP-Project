# GTU NLP Web Scraping Projesi - Teknik Rapor

## 📋 İçindekiler

1. [Proje Genel Bakış](#1-proje-genel-bakış)
2. [Mimari ve Sistem Tasarımı](#2-mimari-ve-sistem-tasarımı)
3. [Teknoloji Stack ve Kütüphaneler](#3-teknoloji-stack-ve-kütüphaneler)
4. [Veritabanı Modelleri](#4-veritabanı-modelleri)
5. [Servisler ve Çalışma Mantığı](#5-servisler-ve-çalışma-mantığı)
6. [NLP Modelleri ve Eğitim Süreci](#6-nlp-modelleri-ve-eğitim-süreci)
7. [API Endpoint'leri](#7-api-endpointleri)
8. [İş Akışı (Workflow)](#8-iş-akışı-workflow)
9. [Özellikler ve Yetenekler](#9-özellikler-ve-yetenekler)
10. [Performans ve Optimizasyon](#10-performans-ve-optimizasyon)

---

## 1. Proje Genel Bakış

### 1.1 Proje Amacı

GTU NLP Web Scraping Projesi, Gebze Teknik Üniversitesi web sitesinden veri çekme, yapılandırma ve NLP (Doğal Dil İşleme) yöntemleriyle sınıflandırma yapan tam kapsamlı bir web uygulamasıdır.

### 1.2 Ana Bileşenler

Proje üç ana aşamadan oluşur:

1. **Web Scraping**: GTU web sitesinden veri çekme
2. **İçerik Yapılandırma**: Çekilen verileri yapılandırılmış formata dönüştürme
3. **NLP Sınıflandırma**: Metinleri kategorilere ayırma ve sentiment analizi

### 1.3 Proje Yapısı

```
nlp-node/
├── backend/              # Node.js backend uygulaması
│   ├── src/
│   │   ├── app.js       # Express uygulaması
│   │   ├── config/      # Konfigürasyon dosyaları
│   │   ├── controllers/ # Route controller'ları
│   │   ├── models/       # MongoDB modelleri
│   │   ├── routes/       # Express route'ları
│   │   ├── services/    # İş mantığı servisleri
│   │   ├── scripts/     # Yardımcı scriptler
│   │   └── utils/       # Yardımcı fonksiyonlar
│   ├── models_cache/    # Eğitilmiş NLP modelleri
│   └── package.json
└── frontend/            # React frontend uygulaması
```

---

## 2. Mimari ve Sistem Tasarımı

### 2.1 Mimari Desen

Proje **MVC (Model-View-Controller)** mimarisini takip eder:

- **Model**: MongoDB şemaları (Mongoose ODM)
- **View**: React frontend (JSON API ile iletişim)
- **Controller**: Express route handler'ları

### 2.2 Katmanlı Mimari

```
┌─────────────────────────────────────┐
│         Frontend (React)            │
│    Dashboard, DataList, Charts      │
└──────────────┬──────────────────────┘
               │ HTTP/REST API
┌──────────────▼──────────────────────┐
│      Controllers (Express)          │
│  dataController, nlpController,     │
│  scrapingController                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Services Layer              │
│  scraperService, nlpService,        │
│  contentExtractorService, etc.      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Models (Mongoose)               │
│  ScrapedData, StructuredContent,    │
│  ClassifiedData, SearchHistory       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         MongoDB Database             │
└──────────────────────────────────────┘
```

### 2.3 Veri Akışı

1. **Scraping Aşaması**:
   ```
   URL Discovery → Content Extraction → Structured Content → Database
   ```

2. **NLP Aşaması**:
   ```
   Structured Content → Language Detection → Text Classification → Classified Data
   ```

---

## 3. Teknoloji Stack ve Kütüphaneler

### 3.1 Backend Teknolojileri

#### Core Framework
- **Node.js** (v18+): JavaScript runtime environment
- **Express.js** (v4.18.2): Web framework
- **MongoDB**: NoSQL veritabanı
- **Mongoose** (v7.5.0): ODM (Object Data Modeling)

#### Web Scraping
- **Cheerio** (v1.0.0-rc.12): Server-side HTML parsing (jQuery benzeri)
- **Puppeteer** (v21.0.0): Headless browser (dinamik içerik için)
- **Axios** (v1.5.0): HTTP client

#### NLP (Natural Language Processing)
- **Natural.js** (v6.5.0): 
  - Naive Bayes Classifier
  - TF-IDF (Term Frequency-Inverse Document Frequency)
  - Word Tokenizer
  - Stop Words
- **Franc** (v6.2.0): Dil tespiti kütüphanesi (400+ dil desteği)

#### Güvenlik ve Middleware
- **Helmet** (v7.0.0): HTTP header güvenliği
- **CORS** (v2.8.5): Cross-Origin Resource Sharing
- **express-rate-limit** (v6.10.0): Rate limiting
- **Morgan** (v1.10.0): HTTP request logger

#### Diğer
- **dotenv** (v16.3.1): Environment variables
- **validator** (v13.11.0): Input validation

### 3.2 Frontend Teknolojileri

- **React**: UI framework
- **Vite**: Build tool ve dev server
- **Material-UI (MUI)**: UI component library
- **Recharts**: Chart/graph library
- **React Router**: Routing
- **Axios**: API client

---

## 4. Veritabanı Modelleri

### 4.1 ScrapedData Model

Ham scraped verileri saklar.

**Şema:**
```javascript
{
  title: String (required, trimmed),
  content: String (default: ''),
  url: String (required, unique, trimmed),
  source: String (required, trimmed),
  scrapedAt: Date (default: Date.now),
  metadata: {
    author: String,
    publishDate: Date,
    tags: [String],
    imageUrl: String
  },
  isClassified: Boolean (default: false),
  searchQuery: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `url`: 1` (unique lookup için)
- `scrapedAt: -1` (tarih sıralaması için)
- `isClassified: 1` (filtreleme için)
- `searchQuery: 1` (arama geçmişi için)

### 4.2 StructuredContent Model

Yapılandırılmış içeriği saklar. ScrapedData ile 1:1 ilişki.

**Şema:**
```javascript
{
  scrapedDataId: ObjectId (ref: ScrapedData, required, unique),
  headers: [{
    level: Number (1-6, h1-h6),
    text: String,
    order: Number
  }],
  paragraphs: [{
    text: String,
    order: Number
  }],
  links: [{
    text: String,
    url: String,
    isInternal: Boolean,
    order: Number
  }],
  images: [{
    alt: String,
    src: String,
    order: Number
  }],
  lists: [{
    type: String (enum: ['ordered', 'unordered']),
    items: [String],
    order: Number
  }],
  cleanText: String,        // NLP için temizlenmiş metin
  wordCount: Number,       // Kelime sayısı
  language: String (default: 'tr'),
  extractedAt: Date (default: Date.now),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `scrapedDataId: 1` (lookup için)
- Text index: `headers.text`, `paragraphs.text`, `cleanText` (full-text search için)

### 4.3 ClassifiedData Model

NLP sınıflandırma sonuçlarını saklar. ScrapedData ile 1:1 ilişki.

**Şema:**
```javascript
{
  scrapedDataId: ObjectId (ref: ScrapedData, required, unique),
  category: String (required, enum: [
    'Haberler',
    'Akademik Duyurular',
    'Etkinlikler',
    'Araştırma Projeleri',
    'Öğrenci Duyuruları',
    'Diğer'
  ]),
  confidence: Number (required, min: 0, max: 1),
  sentiment: String (enum: ['positive', 'neutral', 'negative'], default: 'neutral'),
  sentimentScore: Number (min: -1, max: 1, default: 0),
  keywords: [{
    word: String,
    weight: Number
  }],
  entities: [{
    type: String,
    value: String
  }],
  summary: String,
  nlpMetadata: {
    tokenCount: Number,
    processedAt: Date,
    model: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `category: 1` (kategori filtreleme için)
- `sentiment: 1` (sentiment filtreleme için)
- `confidence: -1` (güven skoruna göre sıralama için)
- `scrapedDataId: 1` (lookup için)

### 4.4 SearchHistory Model

Arama ve scraping işlemlerinin geçmişini saklar.

**Şema:**
```javascript
{
  query: String (required),
  status: String (enum: ['in_progress', 'completed', 'failed']),
  resultsCount: Number,
  scrapedDataIds: [ObjectId],
  error: String,
  createdAt: Date,
  completedAt: Date
}
```

### 4.5 Model İlişkileri

```
ScrapedData (1) ──── (1) StructuredContent
    │
    │ (1)
    │
    └─── (1) ClassifiedData

SearchHistory (1) ──── (N) ScrapedData
```

---

## 5. Servisler ve Çalışma Mantığı

### 5.1 ScraperService

**Amaç**: Web sayfalarından içerik çekme

**Ana Fonksiyonlar:**
- `searchWeb(query, maxResults)`: Web araması yapar (DuckDuckGo/Google)
- `scrapeUrl(url, retries)`: Belirli bir URL'den içerik çeker
- `processSearchResults(results)`: Arama sonuçlarını işler

**Çalışma Mantığı:**
1. Cheerio ile statik içerik çekmeyi dener (daha hızlı)
2. Başarısız olursa Puppeteer ile dinamik içerik çeker
3. Retry mekanizması (varsayılan 2 retry)
4. Exponential backoff ile bekleme
5. Timeout: 20 saniye

**Özellikler:**
- User-Agent spoofing
- HTTP keep-alive connections
- Error handling ve logging

### 5.2 ContentExtractorService

**Amaç**: HTML içeriğini yapılandırılmış formata dönüştürme

**Ana Fonksiyonlar:**
- `extractStructuredContent(url)`: Yapılandırılmış içerik çıkarır
- `extractStructuredContentWithPuppeteer(url)`: Puppeteer ile içerik çıkarır

**Çıkarılan Bileşenler:**
1. **Headers** (h1-h6): Seviye, metin, sıra
2. **Paragraphs**: Paragraf metinleri
3. **Links**: Link metni, URL, internal/external kontrolü
4. **Images**: Alt text, src URL
5. **Lists**: Sıralı/sırasız listeler

**Temizleme İşlemleri:**
- Script, style, noscript, iframe elementleri kaldırılır
- Gereksiz boşluklar temizlenir
- `cleanText`: Tüm metinler birleştirilir (NLP için)
- Kelime sayısı hesaplanır
- Minimum 10 kelime kontrolü

**Dil Tespiti:**
- `languageDetectionService.detectLanguage()` ile dil tespiti yapılır
- Türkçe veya İngilizce olarak işaretlenir

### 5.3 LanguageDetectionService

**Amaç**: Metin dilini tespit etme (Türkçe/İngilizce)

**Kütüphane**: `franc` (400+ dil desteği)

**Algoritma:**
1. Metin uzunluğu < 10 karakter: Basit Türkçe karakter kontrolü
2. Metin uzunluğu >= 10 karakter: `franc` kütüphanesi ile tespit
3. ISO 639-3 kodları → Proje kodlarına mapping:
   - `tur` → `tr`
   - `eng` → `en`
   - Diğerleri → Türkçe karakter varsa `tr`, yoksa `en`

**Fonksiyonlar:**
- `detectLanguage(text)`: Dil tespiti
- `normalizeTextByLanguage(text, language)`: Metin normalizasyonu

### 5.4 NLPService

**Amaç**: Metin sınıflandırma ve NLP işlemleri

**Ana Fonksiyonlar:**
- `trainModels()`: NLP modellerini eğitir
- `classifyText(scrapedDataId)`: Tek bir metni sınıflandırır
- `classifyBatch(limit)`: Toplu sınıflandırma
- `loadTrainedModels()`: Kaydedilmiş modelleri yükler

**Sınıflandırma Yaklaşımı: Hybrid (Rule-based + ML)**

#### 5.4.1 Rule-based Classification

**URL Pattern Matching:**
- `/haber`, `/news`, `/haberler` → Haberler (confidence: 0.9)
- `/duyuru`, `/announcement` → Akademik Duyurular (confidence: 0.85)
- `/etkinlik`, `/event` → Etkinlikler (confidence: 0.9)

**Keyword Matching:**
Her kategori için özel keyword listeleri:
- **Haberler**: haber, news, güncel, başarı, ödül, vb.
- **Akademik Duyurular**: akademik, duyuru, ilan, başvuru, vb.
- **Etkinlikler**: etkinlik, event, seminer, konferans, vb.
- **Araştırma Projeleri**: araştırma, research, proje, ar-ge, vb.
- **Öğrenci Duyuruları**: öğrenci, student, burs, staj, vb.

Skor hesaplama: Her keyword için eşleşme sayısı toplanır, confidence 0.6-0.9 arası hesaplanır.

#### 5.4.2 ML Classification (Naive Bayes)

**Model Türleri:**
- Türkçe Classifier: `turkishClassifier`
- İngilizce Classifier: `englishClassifier`

**Eğitim Süreci:**
1. Veritabanından `StructuredContent` verileri çekilir
2. Dil tespiti yapılır (Türkçe/İngilizce ayrılır)
3. Rule-based ile etiketleme (confidence > 0.7)
4. Tokenization ve stop words kaldırma
5. Naive Bayes classifier'a ekleme
6. Model eğitimi
7. Model dosyaya kaydedilir (`models_cache/`)

**Model Persistence:**
- Kaydetme: `models_cache/turkish-classifier.json`
- Kaydetme: `models_cache/english-classifier.json`
- Yükleme: Uygulama başlatıldığında otomatik

**Tokenization:**
- `natural.WordTokenizer` kullanılır
- Stop words kaldırılır (Türkçe/İngilizce ayrı listeler)
- Minimum 2 karakter, sayılar filtrelenir

#### 5.4.3 Hybrid Classification Logic

Sınıflandırma öncelik sırası:
1. Rule-based (confidence >= 0.8) → Kullan
2. ML model (confidence >= 0.6) → Kullan
3. Rule-based (düşük confidence) → Kullan
4. ML model (düşük confidence) → Kullan
5. Varsayılan: "Diğer" (confidence: 0.5)

#### 5.4.4 Sentiment Analysis

**Algoritma**: Basit keyword-based sentiment analysis

**Pozitif Kelimeler:**
- Türkçe: başarı, ödül, tebrik, kutlama, başarılı, güzel, iyi, harika
- İngilizce: success, award, congratulations, celebration, successful, good, great, excellent

**Negatif Kelimeler:**
- Türkçe: sorun, problem, hata, başarısız, kötü, üzücü
- İngilizce: problem, issue, error, failed, bad, sad

**Skor Hesaplama:**
```
score = (positiveCount - negativeCount) / total
```

**Sınıflandırma:**
- score > 0.2 → positive
- score < -0.2 → negative
- Diğerleri → neutral

#### 5.4.5 Keyword Extraction

**Yöntem**: TF-IDF (Term Frequency-Inverse Document Frequency)

**Süreç:**
1. Tokenization ve stop words kaldırma
2. TF-IDF hesaplama (`natural.TfIdf`)
3. En yüksek ağırlıklı 10 kelime seçilir

### 5.5 DomainService

**Amaç**: Domain analizi ve sayfa keşfi

**Ana Fonksiyonlar:**
- `extractGTUDomains()`: GTU domain'lerini çıkarır
- `extractDomainsFromUrl(url)`: URL'den domain çıkarır
- `discoverGTUPages(baseUrl, maxPages)`: Recursive sayfa keşfi

**Özellikler:**
- Domain ve subdomain analizi
- Recursive link takibi
- Duplicate URL kontrolü
- Depth limit kontrolü

### 5.6 SearchService

**Amaç**: Web araması işlemleri

**Ana Fonksiyonlar:**
- `wideSearchGTU(maxResultsPerQuery, maxResults)`: Geniş arama
- `searchByCategory(category, maxResults)`: Kategori bazlı arama
- `searchMultipleQueries(queries, maxResultsPerQuery)`: Çoklu sorgu araması

---

## 6. NLP Modelleri ve Eğitim Süreci

### 6.1 Model Türleri

#### 6.1.1 Naive Bayes Classifier

**Kütüphane**: Natural.js (`natural.BayesClassifier`)

**Özellikler:**
- Probabilistic classifier
- Her dil için ayrı model (Türkçe/İngilizce)
- Eğitim verisi: Rule-based etiketlenmiş veriler

**Model Dosyaları:**
- `backend/models_cache/turkish-classifier.json`
- `backend/models_cache/english-classifier.json`

### 6.2 Eğitim Süreci

#### 6.2.1 Veri Hazırlama

1. **Veri Toplama:**
   ```javascript
   StructuredContent.aggregate([
     {
       $lookup: {
         from: 'scrapeddata',
         localField: 'scrapedDataId',
         foreignField: '_id',
         as: 'scrapedData'
       }
     },
     {
       $match: {
         cleanText: { $exists: true, $ne: null, $ne: '' },
         scrapedData: { $ne: [] }
       }
     }
   ])
   ```

2. **Filtreleme:**
   - `wordCount >= 10` veya `cleanText.length >= 50`
   - Null/undefined kontrolleri

3. **Dil Ayrımı:**
   - `detectLanguage(cleanText)` ile dil tespiti
   - Türkçe ve İngilizce veriler ayrılır

#### 6.2.2 Etiketleme

**Yöntem**: Rule-based etiketleme

1. Her veri için `ruleBasedClassification()` çağrılır
2. Confidence > 0.7 olanlar kabul edilir
3. Etiketlenen veriler eğitim setine eklenir

#### 6.2.3 Model Eğitimi

**Türkçe Model:**
```javascript
turkishClassifier = new natural.BayesClassifier();

// Her eğitim örneği için
turkishClassifier.addDocument(tokens.join(' '), category);

// Eğitim
turkishClassifier.train();
```

**İngilizce Model:**
Aynı süreç İngilizce veriler için tekrarlanır.

#### 6.2.4 Model Kaydetme

**Yöntem**: Natural.js `save()` metodu

```javascript
classifier.save(modelPath, (err) => {
  if (err) {
    log.error(`Model kaydetme hatası: ${err.message}`);
  } else {
    log.info(`Model dosyaya kaydedildi: ${modelPath}`);
  }
});
```

**Dosya Formatı**: JSON

#### 6.2.5 Model Yükleme

**Zaman**: Uygulama başlatıldığında (`app.js`)

```javascript
import { loadTrainedModels } from './services/nlpService.js';
loadTrainedModels();
```

**Yöntem**: Natural.js `load()` metodu

```javascript
natural.BayesClassifier.load(modelPath, null, (err, classifier) => {
  if (err) {
    log.error(`Model yükleme hatası: ${err.message}`);
  } else {
    turkishClassifier = classifier;
  }
});
```

### 6.3 Model Kullanımı

#### 6.3.1 Sınıflandırma

```javascript
const tokens = tokenizeAndRemoveStopWords(cleanText, language);
const classification = classifier.classify(tokens.join(' '));
const confidence = classifier.getClassifications(tokens.join(' '));
```

#### 6.3.2 Confidence Hesaplama

En yüksek probability değeri confidence olarak kullanılır.

### 6.4 Model Performansı

**Eğitim Verisi:**
- Rule-based etiketlenmiş veriler
- Minimum confidence: 0.7
- Minimum kelime sayısı: 10

**Model Kalitesi:**
- Hybrid yaklaşım ile yüksek doğruluk
- Rule-based yüksek confidence durumlarında öncelikli
- ML model düşük confidence durumlarında devreye girer

---

## 7. API Endpoint'leri

### 7.1 Data Endpoints (`/api/data`)

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

### 7.2 Scraping Endpoints (`/api/scrape`)

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

### 7.3 NLP Endpoints (`/api/nlp`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/nlp/train` | NLP modellerini eğit |
| POST | `/api/nlp/classify` | Tek bir veriyi sınıflandır |
| POST | `/api/nlp/classify/batch` | Toplu sınıflandırma |
| GET | `/api/nlp/categories` | Kategorileri getir |
| GET | `/api/nlp/stats` | NLP istatistiklerini getir |
| GET | `/api/nlp/debug/db` | Veritabanı durumunu kontrol et |

---

## 8. İş Akışı (Workflow)

### 8.1 Tam İş Akışı

```
1. URL Discovery
   ├── Web araması (DuckDuckGo/Google)
   ├── Domain keşfi
   └── Recursive sayfa keşfi
        │
        ▼
2. URL Kaydetme
   └── ScrapedData modeline kaydet
        │
        ▼
3. İçerik Çekme
   ├── Cheerio ile statik içerik
   ├── Puppeteer ile dinamik içerik (fallback)
   └── Retry mekanizması
        │
        ▼
4. İçerik Yapılandırma
   ├── Headers çıkarma
   ├── Paragraphs çıkarma
   ├── Links çıkarma
   ├── Images çıkarma
   ├── Lists çıkarma
   ├── Clean text oluşturma
   └── StructuredContent modeline kaydet
        │
        ▼
5. Dil Tespiti
   └── Franc kütüphanesi ile dil tespiti
        │
        ▼
6. NLP Sınıflandırma
   ├── Rule-based classification
   ├── ML classification (Naive Bayes)
   ├── Hybrid sonuç birleştirme
   ├── Sentiment analysis
   ├── Keyword extraction (TF-IDF)
   └── ClassifiedData modeline kaydet
```

### 8.2 Örnek Senaryo

**1. Veri Çekme:**
```bash
# GTU sayfalarını keşfet
curl "http://localhost:5004/api/scrape/discover?maxPages=50"

# İçerik çek
curl -X POST "http://localhost:5004/api/scrape/content?limit=100"
```

**2. NLP İşlemleri:**
```bash
# Model eğit
curl -X POST "http://localhost:5004/api/nlp/train"

# Sınıflandır
curl -X POST "http://localhost:5004/api/nlp/classify/batch?limit=500"
```

**3. Veri Görüntüleme:**
- Frontend: `http://localhost:5173`
- Dashboard'da istatistikler
- Veriler sayfasında filtreleme ve sıralama

---

## 9. Özellikler ve Yetenekler

### 9.1 Web Scraping Özellikleri

✅ **DuckDuckGo ve Google arama desteği**
- Rate limiting
- Error handling

✅ **Cheerio ve Puppeteer desteği**
- Statik içerik: Cheerio (hızlı)
- Dinamik içerik: Puppeteer (fallback)

✅ **Recursive sayfa keşfi**
- Depth limit kontrolü
- Duplicate URL kontrolü

✅ **Domain ve subdomain analizi**
- GTU domain'lerini otomatik tespit
- Subdomain keşfi

✅ **URL normalizasyonu**
- `/en/` formatına dönüştürme
- Başarısız URL'lerin temizlenmesi

✅ **Retry mekanizması**
- Exponential backoff
- Configurable retry count

### 9.2 İçerik İşleme Özellikleri

✅ **Yapılandırılmış içerik çıkarma**
- Headers (h1-h6)
- Paragraphs
- Links (internal/external)
- Images (alt text, src)
- Lists (ordered/unordered)

✅ **Temiz metin oluşturma**
- Script/style elementleri kaldırma
- Boşluk normalizasyonu
- NLP için optimize edilmiş format

✅ **Dil tespiti**
- Franc kütüphanesi (400+ dil)
- Türkçe/İngilizce odaklı
- Fallback mekanizması

✅ **İçerik filtreleme**
- Minimum kelime sayısı (10)
- PDF, resim, JS/CSS dosyaları filtrelenir

### 9.3 NLP Sınıflandırma Özellikleri

✅ **Hybrid Classification**
- Rule-based (yüksek confidence)
- ML model (Naive Bayes)
- Otomatik sonuç birleştirme

✅ **Dil bazlı modeller**
- Türkçe classifier
- İngilizce classifier
- Otomatik dil tespiti

✅ **Sentiment Analysis**
- Positive/negative/neutral
- Keyword-based scoring
- Dil bazlı kelime listeleri

✅ **Keyword Extraction**
- TF-IDF algoritması
- Top 10 keywords
- Ağırlık skorları

✅ **Model Persistence**
- Disk'e kaydetme
- Otomatik yükleme
- JSON formatında saklama

✅ **Toplu sınıflandırma**
- Batch processing
- Progress tracking
- Error handling

### 9.4 Kategoriler

1. **Haberler**: Haber, güncel gelişmeler, başarılar
2. **Akademik Duyurular**: Akademik ilanlar, duyurular
3. **Etkinlikler**: Seminer, konferans, workshop
4. **Araştırma Projeleri**: Araştırma, proje, AR-GE
5. **Öğrenci Duyuruları**: Öğrenci ilanları, burs, staj
6. **Diğer**: Diğer içerikler

### 9.5 Frontend Özellikleri

✅ **Dashboard**
- 8 KPI kartı
- Pie charts (kategori, sentiment)
- Bar charts (detaylı istatistikler)
- Son eklenen veriler

✅ **Veri Listesi**
- Filtreleme (kategori, arama)
- Sıralama (başlık, kategori, güven)
- Pagination
- Detay modal

✅ **Responsive Tasarım**
- Mobile-friendly
- Dark theme

---

## 10. Performans ve Optimizasyon

### 10.1 Veritabanı Optimizasyonu

**Indexes:**
- URL lookup için unique index
- Tarih sıralaması için descending index
- Kategori/sentiment filtreleme için index
- Full-text search için text index

**Query Optimizasyonu:**
- Lean queries (sadece gerekli alanlar)
- Pagination (limit/skip)
- Aggregate pipelines (efficient joins)

### 10.2 Scraping Optimizasyonu

**Connection Pooling:**
- HTTP keep-alive connections
- Reusable agents

**Rate Limiting:**
- 2 saniye bekleme arası
- Exponential backoff

**Error Handling:**
- Timeout: 20 saniye
- Retry mekanizması
- Failed URL'lerin temizlenmesi

### 10.3 NLP Optimizasyonu

**Model Caching:**
- Disk'ten yükleme (uygulama başlangıcında)
- Bellekte tutma (hızlı erişim)

**Tokenization:**
- Stop words kaldırma (daha az token)
- Minimum token uzunluğu (2 karakter)

**Batch Processing:**
- Toplu sınıflandırma
- Progress tracking

### 10.4 API Optimizasyonu

**Rate Limiting:**
- 100 request / 15 dakika (IP bazlı)
- Express-rate-limit middleware

**Caching:**
- Model caching (bellekte)
- Query result caching (gelecekte eklenebilir)

**Error Handling:**
- Try-catch blokları
- Graceful error responses
- Logging

### 10.5 Güvenlik

**Helmet:**
- HTTP header güvenliği
- XSS protection
- Content Security Policy

**CORS:**
- Configurable origins
- Development: tüm origin'lere izin
- Production: belirli origin'lere izin

**Input Validation:**
- Validator kütüphanesi
- Mongoose schema validation

---

## Sonuç

GTU NLP Web Scraping Projesi, modern web teknolojileri ve NLP yöntemleri kullanarak GTU web sitesinden veri çekme, yapılandırma ve sınıflandırma yapan kapsamlı bir sistemdir. Hybrid classification yaklaşımı ile yüksek doğruluk oranı sağlanmış, model persistence ile sürekli öğrenme imkanı sunulmuştur.

**Güçlü Yönler:**
- Hybrid classification (rule-based + ML)
- Dil bazlı modeller (Türkçe/İngilizce)
- Model persistence
- Comprehensive error handling
- Scalable architecture

**Gelecek Geliştirmeler:**
- Daha fazla eğitim verisi ile model iyileştirme
- Deep learning modelleri (BERT, etc.)
- Real-time classification
- Advanced sentiment analysis
- Entity recognition (NER)

---

**Rapor Tarihi**: 2024  
**Proje Versiyonu**: 1.0.0  
**Hazırlayan**: AI Assistant

