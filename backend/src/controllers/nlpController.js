import { trainModels, classifyText, classifyBatch } from '../services/nlpService.js';
import StructuredContent from '../models/StructuredContent.js';
import ScrapedData from '../models/ScrapedData.js';
import ClassifiedData from '../models/ClassifiedData.js';
import { log } from '../utils/logger.js';

/**
 * Model eğitimi endpoint'i
 */
export const trainModel = async (req, res) => {
  try {
    log.info('Model eğitimi isteği alındı');
    
    const result = await trainModels();
    
    res.json({
      success: result.success,
      message: result.success
        ? `Model eğitimi tamamlandı (TR: ${result.turkishSamples}, EN: ${result.englishSamples} örnek)`
        : result.message,
      data: result,
    });
    
  } catch (error) {
    log.error(`Model eğitimi hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Tekil sınıflandırma endpoint'i
 */
export const classifyData = async (req, res) => {
  try {
    const { scrapedDataId } = req.body;
    
    if (!scrapedDataId) {
      return res.status(400).json({
        success: false,
        message: 'scrapedDataId gerekli',
      });
    }
    
    log.info(`Sınıflandırma isteği: ${scrapedDataId}`);
    
    const result = await classifyText(scrapedDataId);
    
    res.json({
      success: true,
      message: 'Sınıflandırma tamamlandı',
      data: result,
    });
    
  } catch (error) {
    log.error(`Sınıflandırma hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Toplu sınıflandırma endpoint'i
 */
export const classifyBatchData = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    log.info(`Toplu sınıflandırma isteği (limit: ${limit})`);
    
    const result = await classifyBatch(parseInt(limit));
    
    res.json({
      success: true,
      message: `Toplu sınıflandırma tamamlandı: ${result.success} başarılı, ${result.failed} başarısız`,
      data: result,
    });
    
  } catch (error) {
    log.error(`Toplu sınıflandırma hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Kategorileri getir
 */
export const getCategories = async (req, res) => {
  try {
    const categories = [
      'Haberler',
      'Akademik Duyurular',
      'Etkinlikler',
      'Araştırma Projeleri',
      'Öğrenci Duyuruları',
      'Diğer',
    ];
    
    // Her kategori için sayıları getir
    const categoryStats = await ClassifiedData.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
        },
      },
    ]);
    
    res.json({
      success: true,
      categories,
      stats: categoryStats,
    });
    
  } catch (error) {
    log.error(`Kategoriler getirme hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Veritabanı durumunu kontrol et (debug)
 */
export const checkDatabaseStatus = async (req, res) => {
  try {
    const totalStructuredContent = await StructuredContent.countDocuments();
    const totalScrapedData = await ScrapedData.countDocuments();
    
    // cleanText olan StructuredContent sayısı
    const withCleanText = await StructuredContent.countDocuments({
      cleanText: { $exists: true, $ne: null, $ne: '' },
    });
    
    // wordCount >= 10 olanlar
    const withWordCount = await StructuredContent.countDocuments({
      wordCount: { $gte: 10 },
    });
    
    // ScrapedData ile eşleşen StructuredContent
    const withScrapedData = await StructuredContent.aggregate([
      {
        $lookup: {
          from: ScrapedData.collection.name,
          localField: 'scrapedDataId',
          foreignField: '_id',
          as: 'scrapedData',
        },
      },
      {
        $match: {
          scrapedData: { $ne: [] },
        },
      },
      {
        $count: 'count',
      },
    ]);
    
    const sampleData = await StructuredContent.find({
      cleanText: { $exists: true, $ne: null, $ne: '' },
    })
      .limit(3)
      .select('cleanText wordCount scrapedDataId')
      .lean();
    
    res.json({
      success: true,
      database: {
        totalStructuredContent,
        totalScrapedData,
        withCleanText,
        withWordCount,
        withScrapedData: withScrapedData[0]?.count || 0,
        scrapedDataCollectionName: ScrapedData.collection.name,
      },
      sampleData: sampleData.map(item => ({
        scrapedDataId: item.scrapedDataId,
        cleanTextLength: item.cleanText?.length || 0,
        wordCount: item.wordCount,
        cleanTextPreview: item.cleanText?.substring(0, 100) || 'N/A',
      })),
    });
    
  } catch (error) {
    log.error(`Veritabanı durumu kontrol hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * NLP istatistikleri
 */
export const getNlpStats = async (req, res) => {
  try {
    const totalClassified = await ClassifiedData.countDocuments();
    const totalUnclassified = await StructuredContent.countDocuments({
      wordCount: { $gte: 10 },
      cleanText: { $exists: true, $ne: '' },
    }) - totalClassified;
    
    const categoryStats = await ClassifiedData.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
        },
      },
      { $sort: { count: -1 } },
    ]);
    
    const sentimentStats = await ClassifiedData.aggregate([
      {
        $group: {
          _id: '$sentiment',
          count: { $sum: 1 },
        },
      },
    ]);
    
    const avgConfidence = await ClassifiedData.aggregate([
      {
        $group: {
          _id: null,
          avg: { $avg: '$confidence' },
          max: { $max: '$confidence' },
          min: { $min: '$confidence' },
        },
      },
    ]);

    // Toplam kelime sayısı
    const totalWords = await StructuredContent.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$wordCount' },
        },
      },
    ]);

    // Günlük scraping trendi (son 7 gün)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyTrend = await ScrapedData.aggregate([
      {
        $match: {
          scrapedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$scrapedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // En yüksek güven skorlu 5 veri
    const topConfidence = await ClassifiedData.find()
      .sort({ confidence: -1 })
      .limit(5)
      .populate('scrapedDataId', 'title url')
      .lean();

    // Kategori bazında ortalama güven
    const categoryAvgConfidence = await ClassifiedData.aggregate([
      {
        $group: {
          _id: '$category',
          avgConfidence: { $avg: '$confidence' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
    
    res.json({
      success: true,
      stats: {
        totalClassified,
        totalUnclassified,
        categoryStats,
        sentimentStats,
        avgConfidence: avgConfidence[0]?.avg || 0,
        maxConfidence: avgConfidence[0]?.max || 0,
        minConfidence: avgConfidence[0]?.min || 0,
        totalWords: totalWords[0]?.total || 0,
        dailyTrend,
        topConfidence: topConfidence.map(item => ({
          category: item.category,
          confidence: item.confidence,
          title: item.scrapedDataId?.title || 'N/A',
          url: item.scrapedDataId?.url || '',
        })),
        categoryAvgConfidence,
      },
    });
    
  } catch (error) {
    log.error(`NLP istatistikleri hatası: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

