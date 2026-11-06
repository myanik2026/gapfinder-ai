import type { StudySource } from "@/lib/types";

export interface Evidence {
  id: string;
  source: string;
  excerpt: string;
  score: number;
}

const STOP_WORDS = new Set([
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
]);

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((word) => word.length > 2 && !STOP_WORDS.has(word)) ?? [];
}

function splitIntoChunks(source: StudySource): Evidence[] {
  const paragraphs = source.text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (paragraph.length > 900) {
      if (current) chunks.push(current);
      current = "";
      for (let start = 0; start < paragraph.length; start += 750) {
        chunks.push(paragraph.slice(start, start + 900));
      }
      continue;
    }

    if (current && current.length + paragraph.length + 1 > 900) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = current ? `${current}\n${paragraph}` : paragraph;
    }
  }

  if (current) chunks.push(current);

  return chunks.map((excerpt, index) => ({
    id: `${source.id}-${index + 1}`,
    source: source.name,
    excerpt,
    score: 0,
  }));
}

export function retrieveEvidence(
  sources: StudySource[],
  query: string,
  limit = 4,
): Evidence[] {
  const queryTerms = new Set(tokenize(query));
  if (queryTerms.size === 0) return [];

  return sources
    .flatMap(splitIntoChunks)
    .map((chunk) => {
      const terms = tokenize(chunk.excerpt);
      const frequencies = new Map<string, number>();
      for (const term of terms) {
        frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
      }

      const score = [...queryTerms].reduce(
        (total, term) => total + Math.log1p(frequencies.get(term) ?? 0),
        0,
      );
      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
