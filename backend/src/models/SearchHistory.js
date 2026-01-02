import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true,
    },
    resultsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending',
    },
    error: {
      type: String,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    scrapedDataIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ScrapedData',
      },
    ],
    foundUrls: [
      {
        url: String,
        title: String,
        snippet: String,
        searchQuery: String, // Hangi sorgu ile bulundu
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
searchHistorySchema.index({ query: 1 });
searchHistorySchema.index({ status: 1 });
searchHistorySchema.index({ startedAt: -1 });

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

export default SearchHistory;

