"""
Development startup script for ChatBot9000 - simplified POC architecture

This script sets up the development environment and starts the FastAPI server.
It handles environment configuration, dependency checking, and provides helpful
development information.
"""
import os
import sys
import subprocess
import asyncio
from pathlib import Path

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent
BACKEND_ROOT = PROJECT_ROOT / "backend"
APP_ROOT = BACKEND_ROOT / "app"

def check_python_version():
    """Check if Python version meets requirements"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        sys.exit(1)
    else:
        print(f"✅ Python version: {sys.version.split()[0]}")

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        "fastapi",
        "uvicorn",
        "pydantic",
        "google-generativeai"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ {package} is installed")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} is missing")
    
    if missing_packages:
        print(f"\n📦 Installing missing packages: {', '.join(missing_packages)}")
        try:
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", 
                "-r", str(BACKEND_ROOT / "requirements.txt")
            ])
            print("✅ Dependencies installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            print("\nPlease install dependencies manually:")
            print(f"pip install -r {BACKEND_ROOT / 'requirements.txt'}")
            sys.exit(1)

def setup_environment():
    """Set up environment variables"""
    env_file = PROJECT_ROOT / ".env"
    
    if not env_file.exists():
        print("⚠️  No .env file found")
        print("Creating .env template...")
        
        env_template = """# ChatBot9000 Environment Configuration

# Google AI API Key (required)
GOOGLE_API_KEY=your_google_api_key_here

# Server Configuration
HOST=127.0.0.1
PORT=8000
DEBUG=true

# Data Storage
DATA_DIRECTORY=./data

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080
"""
        
        with open(env_file, "w") as f:
            f.write(env_template)
        
        print(f"✅ Created .env template at {env_file}")
        print("\n⚠️  Please update the .env file with your Google API key before starting the server")
        print("Get your API key from: https://makersuite.google.com/app/apikey")
        return False
    else:
        print("✅ .env file found")
        return True

def create_data_directory():
    """Create data directory if it doesn't exist"""
    data_dir = PROJECT_ROOT / "data"
    conversations_dir = data_dir / "conversations"
    
    data_dir.mkdir(exist_ok=True)
    conversations_dir.mkdir(exist_ok=True)
    
    print(f"✅ Data directory ready: {data_dir}")

def start_server():
    """Start the FastAPI development server"""
    print("\n🚀 Starting ChatBot9000 Backend...")
    print("📖 API Documentation will be available at: http://localhost:8000/docs")
    print("🔍 Alternative docs at: http://localhost:8000/redoc")
    print("💚 Health check at: http://localhost:8000/api/v1/health")
    print("\n Press Ctrl+C to stop the server\n")
    
    # Change to app directory
    os.chdir(APP_ROOT)
    
    try:
        # Start uvicorn server
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "main:app",
            "--host", "127.0.0.1",
            "--port", "8000",
            "--reload",
            "--log-level", "info"
        ], check=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except subprocess.CalledProcessError as e:
        print(f"❌ Server failed to start: {e}")
        sys.exit(1)

def main():
    """Main development startup function"""
    print("🤖 ChatBot9000 Backend - Development Startup")
    print("=" * 50)
    
    # Check system requirements
    check_python_version()
    
    # Check and install dependencies
    check_dependencies()
    
    # Set up environment
    env_ready = setup_environment()
    if not env_ready:
        return
    
    # Create data directory
    create_data_directory()
    
    print("\n" + "=" * 50)
    print("✅ Development environment ready!")
    
    # Start the server
    start_server()

if __name__ == "__main__":
    main()
