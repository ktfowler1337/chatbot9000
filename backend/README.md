# ChatBot9000 Backend

A lightweight FastAPI proxy service for Google Generative AI. Completely stateless - all conversation management handled by frontend.

## Architecture

- **Stateless Proxy**: No database, no conversation storage
- **Single Purpose**: Route chat requests to Google AI
- **Simple REST API**: Chat and health endpoints only
- **Fast & Minimal**: ~6 dependencies, <100 lines of core code

## Quick Start

1. **Install & Configure**
   ```bash
   cd backend
   pip install -r requirements.txt
   export GOOGLE_API_KEY="your-api-key-here"  # Get from Google AI Studio
   ```

2. **Run Server**
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

3. **Test**
   ```bash
   curl -X POST http://localhost:8000/api/v1/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello!"}'
   ```

## API Endpoints

- `POST /api/v1/chat` - Send message to AI
- `GET /api/v1/health` - Service health check
- `GET /docs` - Swagger API documentation

## Project Structure

```
backend/app/
├── main.py              # FastAPI app
├── routers/
│   ├── chat.py          # Chat endpoint
│   └── health.py        # Health checks
├── services/
│   └── llm_service.py   # Google AI integration
└── core/
    └── config.py        # Configuration
```

## Configuration

Environment variables:
```env
GOOGLE_API_KEY=your_key_here          # Required
HOST=127.0.0.1                       # Optional
PORT=8000                             # Optional  
DEBUG=true                            # Optional
CORS_ORIGINS=http://localhost:5173    # Optional
```

## License

Part of ChatBot9000 - MIT License
