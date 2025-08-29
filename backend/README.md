# ChatBot9000 Backend

A lightweight FastAPI proxy service for Google Generative AI. Completely stateless - all conversation management handled by frontend.

## Architecture

- **Stateless Proxy**: No database, no conversation storage
- **Single Purpose**: Route chat requests to Google AI
- **Simple REST API**: Chat and health endpoints only
- **Fast & Minimal**: ~6 dependencies, <100 lines of core code

## Quick Start

### Prerequisites
- Python 3.13+
- [Google AI API key](https://makersuite.google.com/app/apikey)

### Development Setup with Virtual Environment

1. **Create and activate virtual environment:**
   ```bash
   cd backend
   
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # Windows (PowerShell)
   venv\Scripts\activate
   
   # Windows (Command Prompt)
   venv\Scripts\activate.bat
   
   # macOS/Linux (bash/zsh)
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables:**
   ```bash
   # Windows (PowerShell)
   $env:GOOGLE_API_KEY="your-api-key-here"
   
   # Windows (Command Prompt)
   set GOOGLE_API_KEY=your-api-key-here
   
   # macOS/Linux (bash/zsh)
   export GOOGLE_API_KEY="your-api-key-here"
   ```

4. **Run the development server:**
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

5. **Test the API:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello!"}'
   ```

### Running Tests

Currently, the backend has no test files. To run tests when they are available:
```bash
python -m pytest
```

### Deactivating Virtual Environment

When you're done working, deactivate the virtual environment:
```bash
deactivate
```

**Note:** Always activate the virtual environment before working on the backend to ensure dependency isolation.

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
