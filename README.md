# 🚀 LLM Gateway & AI Router Backend

A high-performance, robust backend system designed to act as an intelligent gateway and router for Large Language Models (LLMs). This project abstracts multiple AI providers (Mistral, OpenRouter, Groq, DeepSeek) behind a unified, rate-limited, and authenticated API. It features autonomous fallback logic, real-time response streaming, request validation, and centralized logging.

---

## 📑 Table of Contents

- [Core Features](#-core-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#️-environment-variables)
- [Core Mechanisms](#-core-mechanisms)
- [API Documentation](#-api-documentation)
- [How to Use](#-how-to-use-the-chat-apis)
- [Security & Rate Limiting](#-security--rate-limiting)

---

## ✨ Core Features

- **Multi-Provider AI Routing**: Seamlessly switch between Mistral, OpenRouter, Groq, and DeepSeek using a standardized API interface.
- **Intelligent Fallback Logic**: Automatically reroutes requests to secondary model providers if the primary provider fails, ensuring high availability.
- **Real-Time Streaming**: Supports Server-Sent Events (SSE) for streaming LLM responses back to the client word-by-word.
- **Advanced Tools Integration**: Includes built-in utilities like `internet.tool.js` for augmenting AI prompts with real-time web data, and automated chat title generation.
- **Robust Security**: JWT-based user authentication combined with strict API Key validation for programmatic access.
- **Strict Data Validation**: Utilizes express-validator to sanitize and validate all incoming payloads to prevent malformed requests.
- **Comprehensive Logging**: Centralized, asynchronous error handling and logging (via Winston) for easy debugging and monitoring.
- **Rate Limiting**: Protects provider quotas by enforcing customizable request limits per client/IP.

---

## 🏗 System Architecture

The gateway acts as a middleware orchestrator between the client applications and the external AI APIs.

**Request Flow:**

1. **Client Request**: User sends a prompt via the Chat API.
2. **Gateway Pipeline**: Request passes through Rate Limiter → Auth/API Key Guard → Payload Validator.
3. **Routing & Orchestration**: The `chat.controller` dictates the target model. If tools (like internet search) are required, they are executed first.
4. **Adapter Execution**: The specific provider adapter (e.g., `mistral.ai.js`) formats the request for the target API.
5. **Fallback Safety**: If the adapter throws an error, `fallback-logic.js` catches it and tries the next best available model.
6. **Response**: Data is either returned as a complete JSON object or streamed chunk-by-chunk to the client.

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js (v18+) |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Validation | Express Validator |
| Logging | Winston |

---

## 📂 Project Structure

```
backend/
├── server.js                   # Application entry point & HTTP server
├── package.json                # Dependencies and scripts
├── src/
│   ├── app.js                  # Express setup & global middlewares
│   ├── config/
│   │   ├── config.js           # Central env variable loader
│   │   ├── database.js         # MongoDB connection logic
│   │   └── cache.js            # Redis/Memory cache utilities
│   ├── controllers/
│   │   ├── auth.controller.js  # User registration, login, token refresh
│   │   └── chat.controller.js  # Prompt routing, stream handling
│   ├── middlewares/
│   │   ├── apikey.middleware.js# Validates 'x-api-key' headers
│   │   ├── auth.middleware.js  # Validates JWT tokens
│   │   └── error.middleware.js # Global error catcher & formatter
│   ├── models/
│   │   ├── apikey.model.js     # DB schema for generated API keys
│   │   ├── user.model.js       # DB schema for users
│   │   ├── chat.model.js       # DB schema for chat sessions
│   │   └── message.model.js    # DB schema for individual messages
│   ├── services/
│   │   ├── mistral.ai.js       # Mistral API adapter
│   │   ├── openrouter.ai.js    # OpenRouter API adapter
│   │   ├── groq.ai.js          # Groq API adapter
│   │   ├── deepseek.ai.js      # DeepSeek API adapter
│   │   ├── fallback-logic.js   # Autonomous failover mechanism
│   │   ├── internet.tool.js    # Web scraping/search utility for AI
│   │   └── generatechat.title.js # Auto-generates titles for new chats
│   ├── utils/
│   │   ├── async.handler.js    # Wraps controllers to catch unhandled promises
│   │   ├── logger.js           # Winston logger configuration
│   │   └── rate.limit.js       # API usage throttling logic
│   ├── validators/
│   │   ├── auth.validator.js   # Express-validator chains for auth routes
│   │   └── chat.validator.js   # Express-validator chains for chat inputs
│   └── routes/
│       ├── auth.routes.js      # Authentication endpoints
│       └── chat.routes.js      # Chat endpoints
└── logs/                       # Runtime log files (Ignored in Git)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **MongoDB**: Local or cloud instance
- **API Keys**: For Mistral, OpenRouter, Groq, and DeepSeek

### Installation

1. **Clone the repository:**

   ```bash
   git clone <https://github.com/habeebashraf136/llm-gateway-backend.git>
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**

   Create a `.env` file in the root directory (see [Environment Variables](#️-environment-variables) section). Ensure MongoDB is running locally or provide a cloud URI.

4. **Start the server:**

   ```bash
   npm run dev
   ```

   The app will be available on `http://localhost:3000` (or your configured `PORT`).

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory. Ensure this file is never committed to version control.

| Variable | Description | Default / Example |
|----------|-------------|------------------|
| `PORT` | The port the Express server will listen on. | `3000` |
| `NODE_ENV` | Application environment. | `development` |
| `MONGODB_URI` | Connection string for MongoDB. | `mongodb://localhost:27017/llm_gateway` |
| `JWT_SECRET` | Secret key for signing Auth tokens. | `your_jwt_secret_here` |
| `MISTRAL_API_KEY` | Key for Mistral AI integration. | `your mistral apikey` |
| `OPENROUTER_API_KEY` | Key for OpenRouter integration. | `your openRouter apikey` |
| `GROQ_API_KEY` | Key for Groq integration. | `your groq apikey` |
| `DEEPSEEK_API_KEY` | Key for DeepSeek integration. | `your openRouter apikey` |
| `LOG_LEVEL` | Logging verbosity (info, debug, error). | `info` |

---

## 🧠 Core Mechanisms

### Fallback Logic (`fallback-logic.js`)

If a user requests the `mistral` model and the mistral API is experiencing downtime or rate limits, the fallback-logic service intercepts the `5xx` error. It automatically rewrites the request and routes it to a designated fallback provider groq, ensuring the client still receives a response without application failure.

### Provider Adapters (`src/services/`)

Each AI provider requires a slightly different payload structure. Adapters act as translators. They:

- Accept a unified system format
- Morph it into the specific provider's expected schema
- Execute the network call
- Format the output back into the system's unified standard

---

## 📡 API Documentation

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Create a new user account |
| `POST` | `/login` | Authenticate and receive JWT |
| `GET` | `/get-refresh` | Refresh an expired access token |
| `GET` | `/get-user` | Retrieve current user profile |
| `POST` | `/logout` | Invalidate current session |

### Chat Routes (`/api/chat`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/message` | Send a prompt and receive a complete JSON response |
| `POST` | `/message/stream` | Send a prompt and receive an SSE stream (for typing-effect UIs) |
| `GET` | `/getChat` | Retrieve all chat sessions for the authenticated user |
| `GET` | `/getMessages/:chatId` | Retrieve the conversation history for a specific chat |
| `DELETE` | `/deleteChat/:chatId` | Remove a chat session from the database |
| `GET` | `/tokenusage` | Retrieve metric data on token consumption |

---

## 💡 How to Use the Chat APIs

To use the core chat functionalities (`/message` and `/message/stream`), you must provide your API key in the headers of your request.

**Header Key:** `x-api-key`  
**Header Value:** `<your_actual_api_key>`

### 1. Standard Message Endpoint

**POST** `http://localhost:3000/api/chat/message`

Use this endpoint when you want to wait for the AI to finish thinking and receive the complete response at once.

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "api-key: your_api_key_here" \
  -d '{
    "messages": [{"role": "user", "content": "Explain quantum computing."}],
    "model": "mistral"
  }'
```

### 2. Streaming Message Endpoint

**POST** `http://localhost:3000/api/chat/message/stream`

Use this endpoint to receive the response via Server-Sent Events (SSE). This is ideal for chat interfaces where you want to show the text generating word-by-word.

**cURL Example:**

```bash
curl -N -X POST http://localhost:3000/api/chat/message/stream \
  -H "Content-Type: application/json" \
  -H "api-key: your_api_key_here" \
  -d '{
    "messages": [{"role": "user", "content": "Write a short story about space."}],
    "model": "mistral"
  }'
```

---

## 🛡 Security & Rate Limiting

- **API Key Hashing**: All generated API keys are hashed in the database using industry-standard algorithms.

- **Express Validator Validation**: Routes are protected by validation chains. Unrecognized payload properties are handled, missing fields are caught, and incorrect data types are rejected with a `400 Bad Request` before ever hitting the controllers.

- **DDoS Protection**: `rate.limit.js` tracks incoming requests by IP or API Key to prevent abuse of external AI provider quotas.
