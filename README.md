# Qdrant LTM (Long Term Memory) AI Chat

A sophisticated AI chat application that leverages Qdrant vector database for long-term memory storage and retrieval, enabling context-aware conversations with persistent memory.

## Features

- 🤖 LLM chat interface with memory integration
- 🧠 Long-term memory storage using Qdrant vector database
- 📊 WIP: Memory visualization and management
- 🔄 WIP: Context-aware conversations with memory retrieval

## Tech Stack

- **Frontend**: Next.js 14, TS, Tailwind CSS
- **Backend**: NestJS, TS, OpenAI API
- **Database**: Qdrant vector database
- **Embedding**: Local opensource embedding model running with `Transformers.js`

## Project Structure

```
qdrant-ltm/
├── frontend/             # Next.js frontend application
│
├── backend/              # Node.js backend application
│   └── src/
│       └── llm/          # LLM module
│          ├── memory/    # Qdrant memory service (Qdrant Client, OpenAI Client)
│          └── embedding/ # Embedding service (Local Embedding / OpenAI Embedding)
│
├── embedder/             # Local embedding server
├── compose.yml           # Docker compose file
└── .env                  # Environment variables
```

## Setup

You can run the application with all dependencies using Docker Compose or manually by following the instructions below.

**Prerequisites:**
- Docker

### With Docker Compose

**Prerequisites:**
- Docker Compose (recommended)

You may use the supplied `compose.yml` file to run the application with all dependencies.

1. First copy `.env.example` to `.env` and fill in the required variables.

2. Run:
```bash
docker compose up --build
```

**Embedder Note:** It might take a minute for the embedder to download a 500MB embedding model..

See logs with:
```bash
docker compose logs -f
```

### Without Docker Compose

**Prerequisites:**
- pnpm (recommended)

You can run the servcies manually:

1. Qdrant Vector DB
```bash
docker run -p 6333:6333 -v qdrant_storage:/qdrant/storage qdrant/qdrant
```

2. Embedder
```bash
cd embedder
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

**Embedder Note:** It might take a minute for the embedder to download a 500MB embedding model..

3. Backend
```bash
cd backend
pnpm i
pnpm run start:dev
```

4. Frontend
```bash
cd frontend
pnpm i
pnpm run dev
```

## Usage

1. Open the application in your browser at `http://localhost:3000`.
2. Start a new session by clicking the "Start New Session" button
3. Begin chatting with the AI assistant
4. The system will automatically retrieve relevant memories from previous conversations

## Memory Management

The application uses Qdrant vector database to store and retrieve memories. Memories are automatically created and retrieved based on:
- Semantic similarity with current conversation
- Timestamp relevance
- Contextual importance
