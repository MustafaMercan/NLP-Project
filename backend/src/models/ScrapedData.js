import mongoose from 'mongoose';

const scrapedDataSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: '', // İçerik henüz çekilmediyse boş string
    },
    url: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    scrapedAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      author: String,
      publishDate: Date,
      tags: [String],
      imageUrl: String,
    },
    isClassified: {
      type: Boolean,
      default: false,
    },
    searchQuery: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
scrapedDataSchema.index({ url: 1 });
scrapedDataSchema.index({ scrapedAt: -1 });
scrapedDataSchema.index({ isClassified: 1 });
scrapedDataSchema.index({ searchQuery: 1 });

const ScrapedData = mongoose.model('ScrapedData', scrapedDataSchema);

export default ScrapedData;

