import ScrapedData from '../models/ScrapedData.js';
import ClassifiedData from '../models/ClassifiedData.js';
import { log } from '../utils/logger.js';

// Get all classified data with pagination
export const getAllData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    
    // Category filter
    if (req.query.category) {
      const classifiedIds = await ClassifiedData.find({ 
        category: req.query.category 
      }).distinct('scrapedDataId');
      filter._id = { $in: classifiedIds };
    }

    // Search query filter
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Sort parameter
    const sortBy = req.query.sortBy || 'scrapedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // If sorting by category or confidence, we need to use aggregation
    if (sortBy === 'category' || sortBy === 'confidence') {
      const pipeline = [
        { $match: filter },
        {
          $lookup: {
            from: 'classifieddatas',
            localField: '_id',
            foreignField: 'scrapedDataId',
            as: 'classification',
          },
        },
        { $unwind: { path: '$classification', preserveNullAndEmptyArrays: true } },
      ];

      // Add sort stage
      if (sortBy === 'category') {
        pipeline.push({ $sort: { 'classification.category': sortOrder } });
      } else if (sortBy === 'confidence') {
        pipeline.push({ $sort: { 'classification.confidence': sortOrder } });
      } else {
        pipeline.push({ $sort: { scrapedAt: -1 } });
      }

      // Add pagination
      pipeline.push({ $skip: skip }, { $limit: limit });

      const data = await ScrapedData.aggregate(pipeline);
      const total = await ScrapedData.countDocuments(filter);

      const dataWithClassification = data.map((item) => ({
        ...item,
        classification: item.classification || null,
      }));

      return res.json({
        success: true,
        data: dataWithClassification,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    }

    // Default sorting (by scrapedAt or title)
    const sortObj = {};
    if (sortBy === 'title') {
      sortObj.title = sortOrder;
    } else {
      sortObj.scrapedAt = sortOrder;
    }

    const total = await ScrapedData.countDocuments(filter);
    const data = await ScrapedData.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    // Get classification data for each item
    const dataWithClassification = await Promise.all(
      data.map(async (item) => {
        const classification = await ClassifiedData.findOne({
          scrapedDataId: item._id,
        });
        return {
          ...item.toObject(),
          classification: classification || null,
        };
      })
    );

    res.json({
      success: true,
      data: dataWithClassification,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    log.error(`Get all data error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get single data by ID
export const getDataById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await ScrapedData.findById(id);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data not found',
      });
    }

    const classification = await ClassifiedData.findOne({
      scrapedDataId: id,
    });

    res.json({
      success: true,
      data: {
        ...data.toObject(),
        classification: classification || null,
      },
    });
  } catch (error) {
    log.error(`Get data by ID error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get statistics
export const getStats = async (req, res) => {
  try {
    const totalScraped = await ScrapedData.countDocuments();
    const totalClassified = await ClassifiedData.countDocuments();

    const categoryStats = await ClassifiedData.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    const sentimentStats = await ClassifiedData.aggregate([
      {
        $group: {
          _id: '$sentiment',
          count: { $sum: 1 },
        },
      },
    ]);

    const recentScrapes = await ScrapedData.find()
      .sort({ scrapedAt: -1 })
      .limit(5)
      .select('title scrapedAt url');

    // Son 24 saatte eklenen veri sayısı
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    const recent24h = await ScrapedData.countDocuments({
      scrapedAt: { $gte: last24Hours },
    });

    // En çok içerik çekilen kaynaklar
    const topSources = await ScrapedData.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      stats: {
        totalScraped,
        totalClassified,
        categoryStats,
        sentimentStats,
        recentScrapes,
        recent24h,
        topSources,
      },
    });
  } catch (error) {
    log.error(`Get stats error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

