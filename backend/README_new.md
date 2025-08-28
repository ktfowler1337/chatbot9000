# ChatBot9000 LLM Proxy Backend

This is a simplified backend component that serves as a stateless proxy for Google Generative AI. All conversation persistence is handled by the frontend using localStorage.

## Architecture

The backend is a minimal FastAPI service that:

- **Proxies chat requests** to Google Generative AI (Gemini)
- **No conversation storage** - completely stateless
- **Simple REST API** with just chat and health endpoints
- **Fast and lightweight** - minimal dependencies

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── core/
│   │   ├── config.py        # Configuration management
│   │   └── utils.py         # Utility functions and exceptions
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py       # Pydantic models for API
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── chat.py          # Simple chat endpoint
│   │   └── health.py        # Health check endpoints
│   └── services/
│       ├── __init__.py
│       └── llm_service.py   # Google AI integration
├── requirements.txt         # Minimal Python dependencies
└── README.md               # This file
```

## API Endpoints

### Chat
- `POST /api/v1/chat` - Send a message and get AI response (stateless)

### Health & Monitoring
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed health with LLM service status

### Root
- `GET /` - Service information

## Configuration

The server requires only a Google API key:

```env
# Required
GOOGLE_API_KEY=your_google_api_key_here

# Optional (with defaults)
HOST=127.0.0.1
PORT=8000
DEBUG=true
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Get your Google API key from: https://makersuite.google.com/app/apikey

## Quick Start

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up Environment**
   ```bash
   # Set your Google API key
   $env:GOOGLE_API_KEY="your-api-key-here"  # PowerShell
   # OR
   export GOOGLE_API_KEY="your-api-key-here"  # Bash
   ```

3. **Run the Server**
   ```bash
   # From the backend directory
   cd backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **View API Documentation**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## API Usage

### Send a Chat Message

```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "system_prompt": "You are a helpful assistant."
  }'
```

Response:
```json
{
  "response": "Hello! I'm doing well, thank you for asking. How can I help you today?",
  "processing_time_ms": 1247
}
```

### Check Service Health

```bash
curl http://localhost:8000/api/v1/health/detailed
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-27T10:30:00Z",
  "service": "ChatBot9000 LLM Proxy",
  "version": "1.0.0",
  "components": {
    "llm_service": {
      "status": "healthy",
      "message": "Google Generative AI service is accessible"
    },
    "configuration": {
      "status": "healthy", 
      "message": "Google API key is configured"
    }
  }
}
```

## Frontend Integration

The backend is designed to work with a frontend that handles all conversation management:

1. **Frontend** stores conversations in localStorage
2. **Frontend** makes stateless requests to `/api/v1/chat`
3. **Backend** proxies requests to Google AI and returns responses
4. **Frontend** manages conversation history, titles, persistence

This architecture keeps the backend simple while providing full chat functionality.

## Error Handling

The API returns consistent error responses:

```json
{
  "detail": "Human-readable error message",
  "type": "error_type"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `500` - Internal Server Error (LLM service issues)
- `503` - Service Unavailable (health check failures)

## Dependencies

Minimal dependencies for lightweight operation:

- `fastapi>=0.109.0` - Web framework
- `uvicorn[standard]>=0.27.0` - ASGI server  
- `pydantic>=2.5.3` - Data validation
- `pydantic-settings>=2.1.0` - Settings management
- `google-generativeai>=0.3.2` - Google AI integration
- `loguru>=0.7.2` - Logging
- `python-dotenv>=1.0.0` - Environment variables

## Development

### Auto-reload Development Server

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Testing the Service

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Chat test
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is 2+2?"}'
```

## Production Deployment

For production:

1. Set `DEBUG=false` in environment
2. Configure proper CORS origins for your domain
3. Add rate limiting if needed
4. Set up proper logging and monitoring
5. Use environment variables for the API key
6. Consider adding authentication if required

## License

This project is part of the ChatBot9000 application.
