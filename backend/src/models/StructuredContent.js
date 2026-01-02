import mongoose from 'mongoose';

const structuredContentSchema = new mongoose.Schema(
  {
    scrapedDataId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScrapedData',
      required: true,
      unique: true,
    },
    // Yapılandırılmış içerik bölümleri
    headers: [
      {
        level: {
          type: Number, // 1-6 (h1-h6)
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        order: {
          type: Number, // Sayfadaki sırası
        },
      },
    ],
    paragraphs: [
      {
        text: {
          type: String,
          required: true,
        },
        order: {
          type: Number,
        },
      },
    ],
    links: [
      {
        text: {
          type: String, // Link metni
        },
        url: {
          type: String,
          required: true,
        },
        isInternal: {
          type: Boolean, // GTU domain'i içinde mi?
        },
        order: {
          type: Number,
        },
      },
    ],
    images: [
      {
        alt: {
          type: String,
        },
        src: {
          type: String,
          required: true,
        },
        order: {
          type: Number,
        },
      },
    ],
    lists: [
      {
        type: {
          type: String,
          enum: ['ordered', 'unordered'],
        },
        items: [String],
        order: {
          type: Number,
        },
      },
    ],
    // Classification için kullanılacak temiz metin
    cleanText: {
      type: String, // Tüm metinler birleştirilmiş, temizlenmiş hali
    },
    // Metadata
    wordCount: {
      type: Number,
    },
    language: {
      type: String,
      default: 'tr',
    },
    extractedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
structuredContentSchema.index({ scrapedDataId: 1 });
structuredContentSchema.index({ 'headers.text': 'text', 'paragraphs.text': 'text', cleanText: 'text' });

const StructuredContent = mongoose.model('StructuredContent', structuredContentSchema);

export default StructuredContent;

