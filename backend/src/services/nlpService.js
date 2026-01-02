import natural from 'natural';
import StructuredContent from '../models/StructuredContent.js';
import ScrapedData from '../models/ScrapedData.js';
import ClassifiedData from '../models/ClassifiedData.js';
import { detectLanguage, normalizeTextByLanguage } from './languageDetectionService.js';
import { log } from '../utils/logger.js';

// Türkçe ve İngilizce için ayrı classifier'lar
let turkishClassifier = null;
let englishClassifier = null;

// Türkçe stop words (basit liste)
const turkishStopWords = new Set([
  've', 'ile', 'bir', 'bu', 'şu', 'o', 'için', 'olan', 'gibi', 'kadar',
  'de', 'da', 'den', 'dan', 'ki', 'mi', 'mı', 'mu', 'mü', 'var', 'yok',
  'ise', 'ise', 'dır', 'dir', 'dur', 'dür', 'tır', 'tir', 'tur', 'tür',
]);

// İngilizce stop words (Natural kütüphanesinden)
const englishStopWords = natural.stopwords;

/**
 * Metni tokenize eder ve stop words'leri kaldırır
 */
const tokenizeAndRemoveStopWords = (text, language) => {
  if (!text) return [];
  
  // Tokenization
  const tokenizer = new natural.WordTokenizer();
  let tokens = tokenizer.tokenize(text.toLowerCase());
  
  if (!tokens) return [];
  
  // Stop words kaldır
  const stopWords = language === 'tr' ? turkishStopWords : englishStopWords;
  tokens = tokens.filter(token => {
    // Çok kısa token'ları atla
    if (token.length < 2) return false;
    // Stop words'leri atla
    if (stopWords.has(token)) return false;
    // Sadece sayı olanları atla
    if (/^\d+$/.test(token)) return false;
    return true;
  });
  
  return tokens;
};

/**
 * Rule-based sınıflandırma (URL ve keyword bazlı)
 */
const ruleBasedClassification = (scrapedData, structuredContent) => {
  // Null/undefined kontrolleri
  if (!scrapedData || !structuredContent) {
    return null;
  }
  
  const url = (scrapedData.url || '').toLowerCase();
  const title = (scrapedData.title || '').toLowerCase();
  const cleanText = (structuredContent.cleanText || '').toLowerCase();
  const headers = (structuredContent.headers || []).map(h => (h.text || '').toLowerCase()).join(' ');
  const linkTexts = (structuredContent.links || []).map(l => (l.text || '').toLowerCase()).join(' ');
  
  const allText = `${title} ${cleanText} ${headers} ${linkTexts}`.toLowerCase();
  
  // URL pattern matching
  if (url.includes('/haber') || url.includes('/news') || url.includes('/haberler')) {
    return { category: 'Haberler', confidence: 0.9, method: 'url_pattern' };
  }
  
  if (url.includes('/duyuru') || url.includes('/announcement') || url.includes('/duyurular')) {
    return { category: 'Akademik Duyurular', confidence: 0.85, method: 'url_pattern' };
  }
  
  if (url.includes('/etkinlik') || url.includes('/event') || url.includes('/etkinlikler')) {
    return { category: 'Etkinlikler', confidence: 0.9, method: 'url_pattern' };
  }
  
  // Keyword matching
  const keywordRules = {
    'Haberler': [
      'haber', 'news', 'güncel', 'son dakika', 'duyuru', 'açıklama',
      'başarı', 'ödül', 'tebrik', 'kutlama', 'açılış', 'tören',
    ],
    'Akademik Duyurular': [
      'akademik', 'academic', 'duyuru', 'announcement', 'ilan', 'pozisyon',
      'öğretim üyesi', 'öğretim elemanı', 'başvuru', 'application',
      'yönetmelik', 'yönerge', 'karar', 'toplantı',
    ],
    'Etkinlikler': [
      'etkinlik', 'event', 'seminer', 'seminar', 'konferans', 'conference',
      'workshop', 'çalıştay', 'panel', 'söyleşi', 'sergi', 'exhibition',
      'konser', 'concert', 'tarih', 'date', 'saat', 'time', 'yer', 'location',
    ],
    'Araştırma Projeleri': [
      'araştırma', 'research', 'proje', 'project', 'ar-ge', 'r&d',
      'inovasyon', 'innovation', 'teknoloji transfer', 'patent',
      'yayın', 'publication', 'makale', 'article', 'tübitak',
    ],
    'Öğrenci Duyuruları': [
      'öğrenci', 'student', 'burs', 'scholarship', 'staj', 'internship',
      'kariyer', 'career', 'iş', 'job', 'kulüp', 'club', 'topluluk',
      'sosyal', 'spor', 'sport', 'kültür', 'culture',
    ],
  };
  
  // Her kategori için skor hesapla
  const scores = {};
  
  Object.keys(keywordRules).forEach(category => {
    let score = 0;
    keywordRules[category].forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = allText.match(regex);
      if (matches) {
        score += matches.length;
      }
    });
    scores[category] = score;
  });
  
  // En yüksek skorlu kategoriyi bul
  const maxScore = Math.max(...Object.values(scores));
  const maxCategory = Object.keys(scores).find(cat => scores[cat] === maxScore);
  
  if (maxScore > 0) {
    // Confidence hesapla (0.6 - 0.9 arası)
    const confidence = Math.min(0.6 + (maxScore / 10), 0.9);
    return { category: maxCategory, confidence, method: 'keyword_matching' };
  }
  
  return null;
};

/**
 * ML model ile sınıflandırma (Natural Naive Bayes)
 */
const mlClassification = (text, language) => {
  try {
    const classifier = language === 'tr' ? turkishClassifier : englishClassifier;
    
    if (!classifier) {
      log.warn(`${language} classifier henüz eğitilmemiş, rule-based kullanılacak`);
      return null;
    }
    
    const tokens = tokenizeAndRemoveStopWords(text, language);
    if (tokens.length === 0) {
      return null;
    }
    
    const classification = classifier.classify(tokens.join(' '));
    const confidence = classifier.getClassifications(tokens.join(' '));
    
    // En yüksek confidence'ı bul
    const maxConfidence = confidence.reduce((max, item) => 
      item.value > max.value ? item : max
    );
    
    return {
      category: classification,
      confidence: maxConfidence.value,
      method: 'ml_model',
      allProbabilities: confidence,
    };
    
  } catch (error) {
    log.error(`ML classification hatası: ${error.message}`);
    return null;
  }
};

/**
 * Model eğitimi
 */
export const trainModels = async () => {
  try {
    log.info('=== NLP Model Eğitimi Başlatılıyor ===');
    
    // Önce veritabanı durumunu kontrol et
    const totalStructuredContent = await StructuredContent.countDocuments();
    const totalScrapedData = await ScrapedData.countDocuments();
    log.info(`Veritabanı durumu: ${totalStructuredContent} StructuredContent, ${totalScrapedData} ScrapedData`);
    
    if (totalStructuredContent === 0) {
      log.warn('StructuredContent koleksiyonunda veri yok!');
      return { success: false, message: 'StructuredContent koleksiyonunda veri yok. Önce içerik çekme işlemini yapın.' };
    }
    
    // Collection adını kontrol et (MongoDB küçük harf + çoğul kullanır)
    const scrapedDataCollectionName = ScrapedData.collection.name;
    log.info(`ScrapedData collection adı: ${scrapedDataCollectionName}`);
    
    // StructuredContent'ten eğitim verisi çek
    const trainingData = await StructuredContent.aggregate([
      {
        $lookup: {
          from: scrapedDataCollectionName, // Collection adını dinamik kullan
          localField: 'scrapedDataId',
          foreignField: '_id',
          as: 'scrapedData',
        },
      },
      {
        $match: {
          cleanText: { $exists: true, $ne: null, $ne: '' }, // cleanText olmalı
          scrapedData: { $ne: [] }, // scrapedData boş olmamalı
        },
      },
      {
        $project: {
          cleanText: 1,
          wordCount: 1,
          title: { $arrayElemAt: ['$scrapedData.title', 0] },
          url: { $arrayElemAt: ['$scrapedData.url', 0] },
          headers: { $ifNull: ['$headers', []] }, // headers null ise boş array
          language: 1,
        },
      },
      {
        $match: {
          url: { $exists: true, $ne: null, $ne: '' }, // URL olmalı
          cleanText: { $exists: true, $ne: null, $ne: '' }, // cleanText tekrar kontrol
        },
      },
    ]);
    
    log.info(`Aggregate sonucu: ${trainingData.length} veri bulundu`);
    
    // wordCount kontrolü yap (varsa)
    const validTrainingData = trainingData.filter(item => {
      // wordCount varsa ve 10'dan küçükse atla, yoksa kabul et
      if (item.wordCount !== undefined && item.wordCount !== null) {
        return item.wordCount >= 10;
      }
      // wordCount yoksa cleanText uzunluğuna bak
      return item.cleanText && item.cleanText.length >= 50;
    });
    
    log.info(`Geçerli eğitim verisi: ${validTrainingData.length} (wordCount >= 10 veya cleanText.length >= 50)`);
    
    if (validTrainingData.length === 0) {
      log.warn('Eğitim verisi bulunamadı!');
      log.warn(`Toplam StructuredContent: ${totalStructuredContent}, Aggregate sonucu: ${trainingData.length}`);
      return { 
        success: false, 
        message: 'Eğitim verisi yok. Yeterli cleanText veya wordCount olan veri bulunamadı.',
        debug: {
          totalStructuredContent,
          aggregateResult: trainingData.length,
          validTrainingData: validTrainingData.length,
        }
      };
    }
    
    // Geçerli verileri kullan
    const finalTrainingData = validTrainingData;
    log.info(`${finalTrainingData.length} geçerli eğitim verisi bulundu`);
    
    // Dil bazlı ayır
    const turkishData = [];
    const englishData = [];
    
    finalTrainingData.forEach(item => {
      // Null/undefined kontrolleri
      if (!item.cleanText || !item.url) {
        return; // Bu veriyi atla
      }
      
      const detectedLang = detectLanguage(item.cleanText || '');
      const data = {
        text: item.cleanText || '',
        title: item.title || '',
        url: item.url || '',
        headers: item.headers || [],
      };
      
      if (detectedLang === 'tr') {
        turkishData.push(data);
      } else {
        englishData.push(data);
      }
    });
    
    log.info(`Türkçe: ${turkishData.length}, İngilizce: ${englishData.length}`);
    
    // TODO: Manuel etiketleme veya rule-based etiketleme ile eğitim verisi hazırla
    // Şimdilik rule-based ile etiketleme yapacağız
    
    // Türkçe model eğitimi
    if (turkishData.length > 0) {
      turkishClassifier = new natural.BayesClassifier();
      let trainingSampleCount = 0;
      
      // Rule-based ile etiketleme ve eğitim
      turkishData.forEach(item => {
        // Null kontrolleri
        if (!item.text || !item.url) {
          return;
        }
        
        const ruleResult = ruleBasedClassification(
          { title: item.title || '', url: item.url || '' },
          { cleanText: item.text || '', headers: item.headers || [], links: [] }
        );
        
        if (ruleResult && ruleResult.confidence > 0.7) {
          const tokens = tokenizeAndRemoveStopWords(item.text, 'tr');
          if (tokens.length > 0) {
            turkishClassifier.addDocument(tokens.join(' '), ruleResult.category);
            trainingSampleCount++;
          }
        }
      });
      
      if (trainingSampleCount > 0) {
        turkishClassifier.train();
        log.info(`Türkçe model eğitildi: ${trainingSampleCount} eğitim örneği (${turkishData.length} toplam veri)`);
      } else {
        log.warn(`Türkçe model eğitilemedi: Yeterli etiketli örnek bulunamadı (${turkishData.length} veri incelendi)`);
        turkishClassifier = null;
      }
    }
    
    // İngilizce model eğitimi
    if (englishData.length > 0) {
      englishClassifier = new natural.BayesClassifier();
      let trainingSampleCount = 0;
      
      englishData.forEach(item => {
        // Null kontrolleri
        if (!item.text || !item.url) {
          return;
        }
        
        const ruleResult = ruleBasedClassification(
          { title: item.title || '', url: item.url || '' },
          { cleanText: item.text || '', headers: item.headers || [], links: [] }
        );
        
        if (ruleResult && ruleResult.confidence > 0.7) {
          const tokens = tokenizeAndRemoveStopWords(item.text, 'en');
          if (tokens.length > 0) {
            englishClassifier.addDocument(tokens.join(' '), ruleResult.category);
            trainingSampleCount++;
          }
        }
      });
      
      if (trainingSampleCount > 0) {
        englishClassifier.train();
        log.info(`İngilizce model eğitildi: ${trainingSampleCount} eğitim örneği (${englishData.length} toplam veri)`);
      } else {
        log.warn(`İngilizce model eğitilemedi: Yeterli etiketli örnek bulunamadı (${englishData.length} veri incelendi)`);
        englishClassifier = null;
      }
    }
    
    log.info('=== Model Eğitimi Tamamlandı ===');
    
    return {
      success: true,
      turkishSamples: turkishData.length,
      englishSamples: englishData.length,
    };
    
  } catch (error) {
    log.error(`Model eğitimi hatası: ${error.message}`);
    throw error;
  }
};

/**
 * Metni sınıflandırır (Hybrid: Rule-based + ML)
 */
export const classifyText = async (scrapedDataId) => {
  try {
    // StructuredContent ve ScrapedData'yı çek
    const structuredContent = await StructuredContent.findOne({ scrapedDataId })
      .populate('scrapedDataId');
    
    if (!structuredContent) {
      throw new Error('StructuredContent bulunamadı');
    }
    
    const scrapedData = await ScrapedData.findById(scrapedDataId);
    if (!scrapedData) {
      throw new Error('ScrapedData bulunamadı');
    }
    
    const cleanText = structuredContent.cleanText || '';
    const language = detectLanguage(cleanText);
    
    log.info(`Sınıflandırma başlatılıyor (${language}): ${scrapedData.url}`);
    
    // 1. Rule-based sınıflandırma
    const ruleResult = ruleBasedClassification(scrapedData, structuredContent);
    
    // 2. ML model sınıflandırma
    const mlResult = mlClassification(cleanText, language);
    
    // 3. Sonuçları birleştir
    let finalCategory = 'Diğer';
    let finalConfidence = 0.5;
    let method = 'default';
    
    if (ruleResult && ruleResult.confidence >= 0.8) {
      // Rule-based yüksek confidence varsa onu kullan
      finalCategory = ruleResult.category;
      finalConfidence = ruleResult.confidence;
      method = ruleResult.method;
    } else if (mlResult && mlResult.confidence >= 0.6) {
      // ML model sonucu kullan
      finalCategory = mlResult.category;
      finalConfidence = mlResult.confidence;
      method = mlResult.method;
    } else if (ruleResult) {
      // Rule-based düşük confidence
      finalCategory = ruleResult.category;
      finalConfidence = ruleResult.confidence;
      method = ruleResult.method;
    } else if (mlResult) {
      // ML düşük confidence
      finalCategory = mlResult.category;
      finalConfidence = mlResult.confidence;
      method = mlResult.method;
    }
    
    // Keyword extraction
    const tokens = tokenizeAndRemoveStopWords(cleanText, language);
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(tokens.join(' '));
    
    const keywords = [];
    tfidf.listTerms(0).slice(0, 10).forEach(item => {
      keywords.push({
        word: item.term,
        weight: item.tfidf,
      });
    });
    
    // Sentiment analysis (basit)
    const sentiment = analyzeSentiment(cleanText, language);
    
    // ClassifiedData'ya kaydet
    const classifiedData = await ClassifiedData.findOneAndUpdate(
      { scrapedDataId },
      {
        $set: {
          scrapedDataId,
          category: finalCategory,
          confidence: finalConfidence,
          sentiment: sentiment.sentiment,
          sentimentScore: sentiment.score,
          keywords,
          nlpMetadata: {
            tokenCount: tokens.length,
            processedAt: new Date(),
            model: `${language}_hybrid`,
            method,
          },
        },
      },
      { upsert: true, new: true }
    );
    
    // ScrapedData'yı güncelle
    await ScrapedData.updateOne(
      { _id: scrapedDataId },
      { $set: { isClassified: true } }
    );
    
    log.info(`Sınıflandırma tamamlandı: ${finalCategory} (${finalConfidence.toFixed(2)})`);
    
    return classifiedData;
    
  } catch (error) {
    log.error(`Sınıflandırma hatası: ${error.message}`);
    throw error;
  }
};

/**
 * Basit sentiment analysis
 */
const analyzeSentiment = (text, language) => {
  if (!text) {
    return { sentiment: 'neutral', score: 0 };
  }
  
  const lowerText = text.toLowerCase();
  
  // Pozitif kelimeler
  const positiveWords = language === 'tr' 
    ? ['başarı', 'ödül', 'tebrik', 'kutlama', 'başarılı', 'güzel', 'iyi', 'harika']
    : ['success', 'award', 'congratulations', 'celebration', 'successful', 'good', 'great', 'excellent'];
  
  // Negatif kelimeler
  const negativeWords = language === 'tr'
    ? ['sorun', 'problem', 'hata', 'başarısız', 'kötü', 'üzücü']
    : ['problem', 'issue', 'error', 'failed', 'bad', 'sad'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) positiveCount += matches.length;
  });
  
  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) negativeCount += matches.length;
  });
  
  const total = positiveCount + negativeCount;
  if (total === 0) {
    return { sentiment: 'neutral', score: 0 };
  }
  
  const score = (positiveCount - negativeCount) / total;
  
  if (score > 0.2) {
    return { sentiment: 'positive', score: Math.min(score, 1) };
  } else if (score < -0.2) {
    return { sentiment: 'negative', score: Math.max(score, -1) };
  } else {
    return { sentiment: 'neutral', score: 0 };
  }
};

/**
 * Toplu sınıflandırma
 */
export const classifyBatch = async (limit = 50) => {
  try {
    log.info(`Toplu sınıflandırma başlatılıyor (limit: ${limit})`);
    
    // Sınıflandırılmamış StructuredContent'leri bul
    const unclassified = await StructuredContent.aggregate([
      {
        $lookup: {
          from: 'classifieddata',
          localField: 'scrapedDataId',
          foreignField: 'scrapedDataId',
          as: 'classified',
        },
      },
      {
        $match: {
          classified: { $size: 0 }, // Sınıflandırılmamış
          wordCount: { $gte: 10 },
          cleanText: { $exists: true, $ne: '' },
        },
      },
      {
        $limit: limit,
      },
    ]);
    
    log.info(`${unclassified.length} sınıflandırılmamış veri bulundu`);
    
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };
    
    for (const item of unclassified) {
      try {
        await classifyText(item.scrapedDataId);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          scrapedDataId: item.scrapedDataId,
          error: error.message,
        });
        log.error(`Sınıflandırma hatası (${item.scrapedDataId}): ${error.message}`);
      }
    }
    
    log.info(`Toplu sınıflandırma tamamlandı: ${results.success} başarılı, ${results.failed} başarısız`);
    
    return results;
    
  } catch (error) {
    log.error(`Toplu sınıflandırma hatası: ${error.message}`);
    throw error;
  }
};

