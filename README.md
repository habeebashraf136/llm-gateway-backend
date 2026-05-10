# 🚀 LLM Gateway & AI Router Backend

A high-performance, robust backend system designed to act as an intelligent gateway and router for Large Language Models (LLMs). This project abstracts multiple AI providers (Mistral, OpenRouter, Groq, DeepSeek) behind a unified, rate-limited, and authenticated API.

**Key Capabilities:** Autonomous fallback logic • Real-time response streaming • JWT & API Key authentication • Request validation • Centralized logging • Rate limiting protection

---

## 📑 Table of Contents

- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#️-environment-variables)
- [API Documentation](#-api-documentation)
- [Core Mechanisms](#-core-mechanisms)
- [Security & Rate Limiting](#-security--rate-limiting)

---

## ✨ Core Features

- **Multi-Provider AI Routing** — Seamlessly switch between Mistral, OpenRouter, Groq, and DeepSeek using a standardized API interface
- **Intelligent Fallback Logic** — Automatically reroutes requests to secondary providers if the primary fails, ensuring high availability
- **Real-Time Streaming** — Supports Server-Sent Events (SSE) for streaming LLM responses word-by-word to clients
- **Advanced Tools Integration** — Built-in utilities for real-time web data augmentation and automated chat title generation
- **Robust Security** — JWT-based user authentication with strict API Key validation for programmatic access
- **Strict Data Validation** — Express-validator sanitizes and validates all incoming payloads to prevent malformed requests
- **Comprehensive Logging** — Centralized, asynchronous error handling and logging via Winston for easy debugging
- **Rate Limiting** — Protects provider quotas with customizable request limits per client/IP

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js v18+ |
| **Framework** | Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Validation** | Express Validator |
| **Logging** | Winston |
| **Containerization** | Docker & Docker Compose |

---

## 📂 Project Structure

```
backend/
├── server.js                      # Application entry point & HTTP server
├── package.json                   # Dependencies and scripts
├── Dockerfile                     # Container configuration
├── src/
│   ├── app.js                     # Express setup & global middlewares
│   ├── config/
│   │   ├── config.js              # Central environment variable loader
│   │   ├── database.js            # MongoDB connection logic
│   │   └── cache.js               # Redis/Memory cache utilities
│   ├── controllers/
│   │   ├── auth.controller.js     # Registration, login, token refresh
│   │   └── chat.controller.js     # Prompt routing and stream handling
│   ├── middlewares/
│   │   ├── apikey.middleware.js   # Validates 'x-api-key' headers
│   │   ├── auth.middleware.js     # Validates JWT tokens
│   │   └── error.middleware.js    # Global error handler & formatter
│   ├── models/
│   │   ├── user.model.js          # User database schema
│   │   ├── apikey.model.js        # API key storage schema
│   │   ├── chat.model.js          # Chat session schema
│   │   └── message.model.js       # Individual message schema
│   ├── services/
│   │   ├── mistral.ai.js          # Mistral API adapter
│   │   ├── openrouter.ai.js       # OpenRouter API adapter
│   │   ├── groq.ai.js             # Groq API adapter
│   │   ├── deepseek.ai.js         # DeepSeek API adapter
│   │   ├── fallback-logic.js      # Autonomous failover mechanism
│   │   ├── internet.tool.js       # Web scraping/search utility
│   │   └── generatechat.title.js  # Auto-generates chat titles
│   ├── utils/
│   │   ├── async.handler.js       # Wraps controllers to catch unhandled promises
│   │   ├── logger.js              # Winston logger configuration
│   │   └── rate.limit.js          # API usage throttling logic
│   ├── validators/
│   │   ├── auth.validator.js      # Express-validator chains for auth
│   │   └── chat.validator.js      # Express-validator chains for chat
│   └── routes/
│       ├── auth.routes.js         # Authentication endpoints
│       └── chat.routes.js         # Chat endpoints
└── logs/                          # Runtime log files (Git-ignored)
```

---

## 🏗 System Architecture

The gateway acts as a middleware orchestrator between client applications and external AI APIs.

### Request Flow

```
Client Request
    ↓
Rate Limiter
    ↓
Auth/API Key Guard
    ↓
Payload Validator
    ↓
Routing & Orchestration
    ↓
Provider Adapter (Mistral/Groq/OpenRouter/DeepSeek)
    ↓
Fallback Logic (if error) → Try next provider
    ↓
Response (JSON or Streamed)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **MongoDB**: Local or cloud instance
- **API Keys**: Mistral, OpenRouter, Groq, and DeepSeek
- **Docker & Docker Compose** (Optional, but recommended)

### Quick Start with Docker (Recommended)

1. **Clone the repository:**

```bash
git clone https://github.com/habeebashraf136/llm-gateway-backend.git
cd backend
```

2. **Configure environment variables:**

Create a `.env` file in the root directory (see [Environment Variables](#️-environment-variables) section below).

3. **Build and start the container:**

```bash
docker-compose up --build
```

To run in the background:
```bash
docker-compose up --build -d
```

4. **Stop the container:**

```bash
docker-compose down
```

### Manual Installation (Local)

If you prefer to run locally without Docker:

1. **Clone the repository:**

```bash
git clone https://github.com/habeebashraf136/llm-gateway-backend.git
cd backend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**

Create a `.env` file in the root directory. Ensure MongoDB is running locally or provide a cloud URI.

4. **Start the server:**

```bash
npm start
```

The app will be available at `http://localhost:3000` (or your configured PORT).

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory. **Never commit this file to version control.**

| Variable | Description | Default / Example |
|----------|-------------|-------------------|
| `PORT` | Express server listening port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/llm_gateway` |
| `JWT_SECRET` | Secret key for signing auth tokens | `your_jwt_secret_here` |
| `MISTRAL_API_KEY` | Mistral AI integration key | `your_mistral_apikey` |
| `OPENROUTER_API_KEY` | OpenRouter integration key | `your_openrouter_apikey` |
| `GROQ_API_KEY` | Groq integration key | `your_groq_apikey` |
| `DEEPSEEK_API_KEY` | DeepSeek integration key | `your_deepseek_apikey` |
| `TAVILY_API_KEY` | Tavily integration key for web data augmentation | `your_tavily_apikey` |


---

## 📡 API Documentation

### Authentication Routes

**Base Path:** `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Create a new user account |
| `POST` | `/login` | Authenticate and receive JWT token |
| `GET` | `/get-refresh` | Refresh an expired access token |
| `GET` | `/get-user` | Retrieve current user profile |
| `POST` | `/logout` | Invalidate current session |

### Chat Routes

**Base Path:** `/api/chat`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/message` | Send a prompt, receive complete JSON response |
| `POST` | `/message/stream` | Send a prompt, receive SSE stream (typing-effect) |
| `GET` | `/getChat` | Retrieve all chat sessions for authenticated user |
| `GET` | `/getMessages/:chatId` | Retrieve conversation history for a specific chat |
| `DELETE` | `/deleteChat/:chatId` | Remove a chat session from database |
| `GET` | `/tokenusage` | Retrieve token consumption metrics |

### Using the Chat APIs

**Required Header:** 
- `api-key`: Your API key
- `Authorization`: Bearer JWT token

#### Example: Standard Message Endpoint

```bash
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "api-key: your_api_key_here" \
  -H "Authorization: Bearer your_jwt_token_here" \
  -d '{
    "messages": [{"role": "user", "content": "Explain quantum computing."}],
    "model": "mistral"
  }'
```

#### Example: Streaming Message Endpoint

```bash
curl -N -X POST http://localhost:3000/api/chat/message/stream \
  -H "Content-Type: application/json" \
  -H "api-key: your_api_key_here" \
  -H "Authorization: Bearer your_jwt_token_here" \
  -d '{
    "messages": [{"role": "user", "content": "Write a short story about space."}],
    "model": "mistral"
  }'
```

---

## 🧠 Core Mechanisms

### Fallback Logic

Located in `src/services/fallback-logic.js`, this mechanism ensures high availability:

- When a user requests a specific model (e.g., mistral) and that provider experiences downtime or rate limits, the fallback service intercepts the error
- The request is automatically rerouted to a designated secondary provider (e.g., groq)
- The client receives a response without application failure

### Provider Adapters

Each AI provider requires a different payload structure. Located in `src/services/`:

- **Accept** a unified system format
- **Transform** into the provider's expected schema
- **Execute** the network call
- **Format** the output back into the system's unified standard

This abstraction allows seamless provider switching without client-side changes.

---

## 🛡 Security & Rate Limiting

- **API Key Hashing**: All generated API keys are hashed in the database using industry-standard algorithms
- **Request Validation**: Express-validator protects routes with validation chains. Unrecognized properties are handled, missing fields are caught, and incorrect data types are rejected with `400 Bad Request`
- **DDoS Protection**: `rate.limit.js` tracks incoming requests by IP or API Key to prevent abuse of external AI provider quotas
- **JWT Authentication**: Secure token-based user sessions with expiration and refresh mechanisms

