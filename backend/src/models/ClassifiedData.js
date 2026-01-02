import mongoose from 'mongoose';

const classifiedDataSchema = new mongoose.Schema(
  {
    scrapedDataId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScrapedData',
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Haberler',
        'Akademik Duyurular',
        'Etkinlikler',
        'Araştırma Projeleri',
        'Öğrenci Duyuruları',
        'Diğer',
      ],
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
    },
    sentimentScore: {
      type: Number,
      min: -1,
      max: 1,
      default: 0,
    },
    keywords: [
      {
        word: String,
        weight: Number,
      },
    ],
    entities: [
      {
        type: String,
        value: String,
      },
    ],
    summary: {
      type: String,
    },
    nlpMetadata: {
      tokenCount: Number,
      processedAt: Date,
      model: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
classifiedDataSchema.index({ category: 1 });
classifiedDataSchema.index({ sentiment: 1 });
classifiedDataSchema.index({ confidence: -1 });
classifiedDataSchema.index({ scrapedDataId: 1 });

const ClassifiedData = mongoose.model('ClassifiedData', classifiedDataSchema);

export default ClassifiedData;

