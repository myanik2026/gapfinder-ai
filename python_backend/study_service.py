import math
import re
from collections.abc import Sequence

STOP_WORDS = {
    "about",
    "after",
    "also",
    "and",
    "are",
    "because",
    "does",
    "from",
    "have",
    "into",
    "that",
    "the",
    "their",
    "this",
    "what",
    "when",
    "where",
    "which",
    "with",
}


def tokenize(value: str) -> list[str]:
    return [
        word
        for word in re.findall(r"[a-z0-9]+", value.lower())
        if len(word) > 2 and word not in STOP_WORDS
    ]


def split_into_chunks(source: dict) -> list[dict]:
    paragraphs = [paragraph.strip() for paragraph in re.split(r"\n+", source["text"]) if paragraph.strip()]
    chunks: list[str] = []
    current = ""

    for paragraph in paragraphs:
        if len(paragraph) > 900:
            if current:
                chunks.append(current)
                current = ""
            for start in range(0, len(paragraph), 750):
                chunks.append(paragraph[start : start + 900])
            continue

        if current and len(current) + len(paragraph) + 1 > 900:
            chunks.append(current)
            current = paragraph
        else:
            current = f"{current}\n{paragraph}" if current else paragraph

    if current:
        chunks.append(current)

    return [
        {
            "id": f"{source['id']}-{index + 1}",
            "source": source["name"],
            "excerpt": chunk,
            "score": 0,
        }
        for index, chunk in enumerate(chunks)
    ]


def retrieve_evidence(sources: Sequence[dict], query: str, limit: int = 4) -> list[dict]:
    query_terms = set(tokenize(query))
    if not query_terms:
        return []

    ranked_chunks = []
    for source in sources:
        for chunk in split_into_chunks(source):
            terms = tokenize(chunk["excerpt"])
            frequencies: dict[str, int] = {}
            for term in terms:
                frequencies[term] = frequencies.get(term, 0) + 1

            score = sum(math.log1p(frequencies.get(term, 0)) for term in query_terms)
            ranked_chunks.append({**chunk, "score": score})

    filtered = [chunk for chunk in ranked_chunks if chunk["score"] > 0]
    filtered.sort(key=lambda chunk: chunk["score"], reverse=True)
    return filtered[:limit]
