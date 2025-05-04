import logging
import os
import time

from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

model_name = os.getenv("EMBEDDING_MODEL_NAME", "jinaai/jina-embeddings-v3")
logger.info(f"Using model: {model_name}")

start_time = time.time()
model = SentenceTransformer(model_name, trust_remote_code=True)
logger.info(f"Model loaded in {time.time() - start_time:.1f} seconds")

logger.info("Starting server...")
app = FastAPI()


class EmbedRequest(BaseModel):
    texts: list[str]


@app.post("/embed")
def embed(req: EmbedRequest):
    embeddings = model.encode(req.texts, normalize_embeddings=True).tolist()
    return {"embeddings": embeddings}


@app.get("/info")
def info():
    return {
        "model_name": model_name,
        "dimension": model.get_sentence_embedding_dimension(),
    }


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=3002)
