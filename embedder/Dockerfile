FROM python:3.13-slim

WORKDIR /app
COPY requirements.txt .
RUN apt-get update && apt-get install -y curl && pip install --no-cache-dir -r requirements.txt
COPY . .

ENV HOST="0.0.0.0"
ENV PORT="3002"
ENV MODEL_NAME="jinaai/jina-embeddings-v3"

EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD curl -f "http://localhost:$PORT/health" || exit 1
CMD ["python", "app.py"]
