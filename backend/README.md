# GTU NLP Web Scraping - Backend

Backend API for Gebze Teknik Üniversitesi NLP Web Scraping Project.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/gtu-nlp
FRONTEND_URL=http://localhost:3000
```

3. Start the development server:
```bash
npm run dev
```

Or start the production server:
```bash
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── models/          # MongoDB models
│   ├── routes/          # Express routes
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   └── app.js           # Main application file
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Data Endpoints
- `GET /api/data` - Get all data with filters (page, limit, category, search)
- `GET /api/data/stats` - Get statistics
- `GET /api/data/:id` - Get single data by ID

### Scraping Endpoints (To be implemented)
- `POST /api/scrape` - Start new scraping
- `GET /api/scrape/status/:id` - Get scraping status
- `GET /api/scrape/results/:id` - Get scraping results

### NLP Endpoints (To be implemented)
- `POST /api/nlp/classify` - Classify data
- `GET /api/nlp/categories` - Get categories
- `GET /api/nlp/stats` - Get NLP statistics

## 📊 Database Models

### ScrapedData
- Stores raw scraped data from web sources
- Fields: title, content, url, source, metadata, etc.

### ClassifiedData
- Stores NLP classification results
- Fields: category, confidence, sentiment, keywords, entities, etc.

### SearchHistory
- Tracks search and scraping operations
- Fields: query, status, resultsCount, etc.

## 🛠️ Technologies

- Express.js - Web framework
- MongoDB + Mongoose - Database
- Natural - NLP library
- Cheerio - HTML parsing
- Puppeteer - Web scraping

## 📝 Environment Variables

See `.env.example` for all available environment variables.

## 🔒 Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation

## 📦 Dependencies

See `package.json` for full list of dependencies.

