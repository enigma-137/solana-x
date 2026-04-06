# Solana Content Generator

A full-stack dApp that verifies Solana transactions on-chain, scrapes web content, and uses Gemini AI to generate social media posts (tweets/threads).

## Tech Stack

- **Backend**: Rust (Axum, Solana SDK, Reqwest, Gemini API)
- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Solana Wallet Adapter

## Getting Started

### Prerequisites

- Rust 1.75+
- Node.js 18+
- A Solana wallet (Phantom recommended)
- Gemini API key

### Environment Variables

Create `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
SOLANA_RPC=https://api.devnet.solana.com
PORT=3001
```

### Running Locally

**Backend:**
```bash
cd backend
cargo run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and communicates with the backend at `http://localhost:3001`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/generate` | Generate content from transaction + URL |
| GET | `/health` | Health check |

### Generate Endpoint

**Request:**
```json
{
  "tx_signature": "...",
  "url": "https://example.com/article",
  "content_type": "thread"
}
```

**Response:**
```json
{
  "success": true,
  "content": "Generated tweet/thread text..."
}
```

`content_type` can be "thread" (default) or "tweet".

## Project Structure

```
solana/
├── backend/
│   └── src/
│       ├── main.rs       # API routes
│       └── services/
│           ├── mod.rs   # Service exports
│           ├── scraper.rs  # URL scraping
│           └── gemini.rs    # AI content generation
└── frontend/
    ├── src/
    │   ├── app/        # Next.js pages
    │   ├── providers/  # Wallet context
    │   └── hooks/      # Custom hooks
    └── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/xxx`)
3. Commit your changes
4. Push to the branch
5. Open a pull request