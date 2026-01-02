# NLP Sınıflandırma Planı

## 📊 Veritabanı Modelleri Kullanımı

### 1. Veri Kaynakları

**StructuredContent (Ana Veri Kaynağı)**
- `cleanText` → **Ana metin** (classification için en önemli)
- `headers[]` → Başlık özellikleri (H1-H6)
- `paragraphs[]` → Paragraf metinleri
- `links[]` → Link metinleri ve URL'leri
- `wordCount` → Kelime sayısı
- `language` → Dil bilgisi (tr/en)

**ScrapedData (Ek Özellikler)**
- `title` → Sayfa başlığı
- `url` → URL pattern'leri
- `source` → Domain bilgisi

**ClassifiedData (Sonuçlar)**
- `category` → Sınıflandırma sonucu
- `confidence` → Güven skoru
- `sentiment` → Duygu analizi
- `keywords[]` → Anahtar kelimeler
- `entities[]` → Varlık tanıma

## 🤖 Model Seçenekleri

### Seçenek 1: Natural Kütüphanesi (Naive Bayes) - ÖNERİLEN
**Avantajlar:**
- Node.js native, hızlı
- Kolay implementasyon
- Küçük-orta veri setleri için yeterli
- Türkçe ve İngilizce desteği

**Dezavantajlar:**
- Basit model (Naive Bayes)
- Büyük veri setlerinde sınırlı

### Seçenek 2: TensorFlow.js
**Avantajlar:**
- Daha gelişmiş modeller
- Deep learning desteği
- Transfer learning

**Dezavantajlar:**
- Daha karmaşık
- Daha fazla kaynak gerektirir
- Model boyutu büyük

### Seçenek 3: Hybrid (Rule-based + ML)
**Avantajlar:**
- En iyi sonuçlar
- URL pattern'leri + keyword matching + ML
- Hızlı ve doğru

## 🌍 Dil Desteği Stratejisi

### Yaklaşım 1: Ayrı Modeller (ÖNERİLEN)
- Türkçe için ayrı model
- İngilizce için ayrı model
- Language detection ile otomatik seçim

### Yaklaşım 2: Çok Dilli Model
- Tek model, her iki dil için
- Daha karmaşık preprocessing

## 📋 Önerilen Yapı

### 1. Veri Hazırlama
```javascript
// StructuredContent'ten eğitim verisi çek
const trainingData = await StructuredContent.aggregate([
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
      wordCount: { $gte: 10 },
      cleanText: { $exists: true, $ne: '' }
    }
  }
]);
```

### 2. Feature Extraction
- `cleanText` → TF-IDF veya word embeddings
- `title` → Title features
- `url` → URL pattern features
- `headers` → Header features
- `language` → Dil bilgisi

### 3. Model Eğitimi
- Türkçe veriler → Türkçe model
- İngilizce veriler → İngilizce model
- Rule-based kurallar (URL, keywords)

### 4. Sınıflandırma
- Language detection
- Uygun model seçimi
- Rule-based + ML hybrid
- Sonuçları ClassifiedData'ya kaydet

## 🎯 Kategoriler

1. **Haberler** - News, haber, güncel
2. **Akademik Duyurular** - Academic, duyuru, announcement
3. **Etkinlikler** - Event, etkinlik, workshop, seminer
4. **Araştırma Projeleri** - Research, proje, araştırma
5. **Öğrenci Duyuruları** - Student, öğrenci, burs, staj
6. **Diğer** - Diğer tüm içerikler

## 🔄 İş Akışı

1. StructuredContent'ten veri çek
2. Language detection yap
3. Preprocessing (tokenization, stemming)
4. Feature extraction
5. Rule-based kontrol (URL, keywords)
6. ML model ile sınıflandır
7. Sonuçları birleştir
8. ClassifiedData'ya kaydet

