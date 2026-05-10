# 🚀 LLM Gateway & AI Router Backend

A backend system that acts as a smart gateway between your app and multiple AI providers. Instead of being locked into one model, your app sends a request to the gateway — and the gateway picks the right model for the job, routes it there, and if that model fails, automatically falls back to another one.

No broken requests. No manual switching. Just one clean API.

---

## 📑 Table of Contents

- [How It Works](#-how-it-works)
- [Routing Logic](#-routing-logic)
- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Core Mechanisms](#-core-mechanisms)
- [Security & Rate Limiting](#-security--rate-limiting)

---

## 💡 How It Works

When you're building an AI-powered app, you usually hardcode one provider — Mistral, OpenAI, whatever. That works until that provider goes down, hits a rate limit, or becomes too expensive. Now your whole app is broken.

This gateway sits between your frontend and all the AI providers. Your app talks to **one API**. The gateway handles the rest.

```
Your App  →  LLM Gateway  →  Mistral / Qwen / DeepSeek / Groq
```

---

## 🧭 Routing Logic

The gateway doesn't route randomly. It picks the model based on **what the task actually needs**:

| Task Type | Primary Model | Why |
|-----------|--------------|-----|
| **Fast response** | Mistral | Lightweight, low latency, great for general chat |
| **Creative tasks** | Qwen (via OpenRouter) | Strong at creative writing, storytelling, ideation |
| **Code tasks** | DeepSeek | Purpose-built for coding, debugging, code review |
| **Fallback (any failure)** | Groq | Extremely fast inference — steps in silently if any primary model fails |

If Mistral, Qwen, or DeepSeek goes down or hits an error — **Groq automatically takes over**. The client never sees the failure.

---

## ✨ Core Features

- **Task-Based AI Routing** — Routes requests to the right model based on task type (fast, creative, coding)
- **Intelligent Fallback Logic** — If the primary model fails, Groq steps in automatically with zero downtime
- **Real-Time Streaming** — Server-Sent Events (SSE) support for word-by-word streaming responses like ChatGPT
- **Web-Augmented Responses** — Built-in Tavily integration fetches real-time web data to enrich AI responses before they're sent
- **Auto Chat Titles** — Automatically generates a title for every new chat session
- **Dual Authentication** — JWT tokens for users + API key validation for programmatic access
- **Request Validation** — Express-validator sanitizes every incoming payload and rejects malformed requests with `400 Bad Request`
- **Centralized Logging** — Winston handles all logs asynchronously across the entire system
- **Rate Limiting** — Per-IP and per-API-key throttling to protect provider quotas from abuse
- **Dockerized** — Runs cleanly in a Docker container with Docker Compose support

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js v18+ |
| Framework | Express.js |
| Database | MongoDB with Mongoose ODM |
| Validation | Express Validator |
| Logging | Winston |
| Containerization | Docker & Docker Compose |
| Web Augmentation | Tavily API |
| AI Providers | Mistral, OpenRouter (Qwen), Groq, DeepSeek |

---

## 🏗 System Architecture

The gateway acts as a middleware orchestrator between your client and the external AI APIs.

**Request Flow:**

```
Client Request
    ↓
Rate Limiter          → blocks abuse before anything else
    ↓
Auth / API Key Guard  → validates JWT or x-api-key header
    ↓
Payload Validator     → rejects malformed or missing fields
    ↓
Chat Controller       → reads task type, decides which model to use
    ↓
Internet Tool         → fetches real-time web data via Tavily (if needed)
    ↓
Provider Adapter      → formats request for target model (Mistral / Qwen / DeepSeek)
    ↓
Fallback Logic        → if adapter throws error, retries with Groq
    ↓
Response              → returned as full JSON or streamed chunk-by-chunk via SSE
```

---

## 📂 Project Structure

```
backend/
├── server.js                      # Application entry point & HTTP server
├── package.json                   # Dependencies and scripts
├── Dockerfile                     # Container configuration
├── docker-compose.yml             # Multi-container orchestration
├── .env.example                   # Environment variable template
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
│   │   ├── apikey.middleware.js   # Validates x-api-key headers
│   │   ├── auth.middleware.js     # Validates JWT tokens
│   │   └── error.middleware.js    # Global error handler & formatter
│   ├── models/
│   │   ├── user.model.js          # User database schema
│   │   ├── apikey.model.js        # API key storage schema
│   │   ├── chat.model.js          # Chat session schema
│   │   └── message.model.js       # Individual message schema
│   ├── services/
│   │   ├── mistral.ai.js          # Mistral API adapter (fast tasks)
│   │   ├── openrouter.ai.js       # OpenRouter API adapter (Qwen - creative tasks)
│   │   ├── groq.ai.js             # Groq API adapter (fallback)
│   │   ├── deepseek.ai.js         # DeepSeek API adapter (coding tasks)
│   │   ├── fallback-logic.js      # Autonomous failover mechanism
│   │   ├── internet.tool.js       # Tavily web search utility for real-time data
│   │   └── generatechat.title.js  # Auto-generates chat session titles
│   ├── utils/
│   │   ├── async.handler.js       # Wraps controllers to catch unhandled promises
│   │   ├── logger.js              # Winston logger configuration
│   │   └── rate.limit.js          # API usage throttling logic
│   ├── validators/
│   │   ├── auth.validator.js      # Express-validator chains for auth routes
│   │   └── chat.validator.js      # Express-validator chains for chat routes
│   └── routes/
│       ├── auth.routes.js         # Authentication endpoints
│       └── chat.routes.js         # Chat endpoints
└── logs/                          # Runtime log files (Git-ignored)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm v9+
- MongoDB (local or cloud)
- Docker & Docker Compose (optional but recommended)
- API Keys for: Mistral, OpenRouter, Groq, DeepSeek, Tavily

---

### Option 1 — Docker (Recommended)

```bash
# 1. Clone the repo
git clone https://github.com/habeebashraf136/llm-gateway-backend.git
cd backend

# 2. Copy the env template and fill in your keys
cp .env.example .env

# 3. Build and start
docker-compose up --build

# Run in background
docker-compose up --build -d

# Stop
docker-compose down
```

---

### Option 2 — Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/habeebashraf136/llm-gateway-backend.git
cd backend

# 2. Install dependencies
npm install

# 3. Copy the env template and fill in your keys
cp .env.example .env

# 4. Start the server
npm start
```

App runs at `http://localhost:3000` (or your configured `PORT`).

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your values. **Never commit `.env` to version control.**

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port the Express server listens on | `3000` |
| `NODE_ENV` | App environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/llm_gateway` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your_jwt_secret_here` |
| `MISTRAL_API_KEY` | API key for Mistral (fast routing) | `your_mistral_key` |
| `OPENROUTER_API_KEY` | API key for OpenRouter (Qwen - creative routing) | `your_openrouter_key` |
| `GROQ_API_KEY` | API key for Groq (fallback model) | `your_groq_key` |
| `DEEPSEEK_API_KEY` | API key for DeepSeek (coding routing) | `your_deepseek_key` |
| `TAVILY_API_KEY` | API key for Tavily web search (real-time data augmentation) | `your_tavily_key` |
| `LOG_LEVEL` | Winston log verbosity | `info` |

---

## 📡 API Documentation

### Authentication Routes — `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Create a new user account |
| `POST` | `/login` | Authenticate and receive a JWT token |
| `GET` | `/get-refresh` | Refresh an expired access token |
| `GET` | `/get-user` | Get the current authenticated user's profile |
| `POST` | `/logout` | Invalidate the current session |

---

### Chat Routes — `/api/chat`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/message` | Send a prompt and receive a complete JSON response |
| `POST` | `/message/stream` | Send a prompt and receive an SSE stream (word-by-word) |
| `GET` | `/getChat` | Get all chat sessions for the authenticated user |
| `GET` | `/getMessages/:chatId` | Get full conversation history for a specific chat |
| `DELETE` | `/deleteChat/:chatId` | Delete a chat session from the database |
| `GET` | `/tokenusage` | Get token consumption metrics |

---

### Required Headers

Every chat request needs both of these headers:

```
Content-Type:  application/json
api-key:       <your_api_key>
Authorization: Bearer <your_jwt_token>
```

---

### Example: Standard Message

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

---

### Example: Streaming Message (SSE)

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

### Fallback Logic (`src/services/fallback-logic.js`)

When a primary model (Mistral, Qwen, or DeepSeek) returns a `5xx` error or hits a rate limit, the fallback service intercepts it and automatically reroutes the request to **Groq**. The client receives a response as if nothing happened.

```
Primary model fails
    ↓
fallback-logic.js intercepts the error
    ↓
Request rerouted to Groq
    ↓
Client gets a response — no failure exposed
```

---

### Provider Adapters (`src/services/`)

Every AI provider expects a different request format. Adapters handle this translation layer:

1. Accept the gateway's unified request format
2. Transform it into the provider's expected schema
3. Execute the API call
4. Format the response back into the gateway's unified output

This means adding a new provider = writing one new adapter file. Nothing else changes.

---

### Web Augmentation (`src/services/internet.tool.js`)

When a user's prompt requires real-time information (news, current events, live data), `internet.tool.js` fires a **Tavily** web search before the prompt is sent to the AI. The search results are injected into the context, giving the model up-to-date information to work with.

---

## 🛡 Security & Rate Limiting

- **API Key Hashing** — All API keys are hashed before being stored in the database
- **JWT Authentication** — Secure token-based sessions with expiration and refresh support
- **Request Validation** — Every route is protected by Express-validator chains. Missing fields, wrong data types, and unrecognized properties are all rejected with `400 Bad Request` before hitting any controller
- **Rate Limiting** — `rate.limit.js` tracks requests by IP and API key. Exceeding the limit returns `429 Too Many Requests` to protect provider quotas from abuse


> Built by [Mohammed Habeeb Ashraf]