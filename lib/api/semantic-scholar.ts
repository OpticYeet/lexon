const S2_API_URL = "https://api.semanticscholar.org/graph/v1";

// Search queries mapped to our fields
export const S2_FIELD_QUERIES: Record<string, string[]> = {
  biology: ["molecular biology", "genetics", "ecology", "cell biology"],
  physics: ["quantum physics", "astrophysics", "particle physics"],
  chemistry: ["organic chemistry", "materials science", "catalysis"],
  mathematics: ["number theory", "combinatorics", "probability theory"],
  "cs-ai": ["machine learning", "natural language processing", "computer vision"],
  economics: ["microeconomics", "behavioral economics", "econometrics"],
  psychology: ["cognitive psychology", "neuroscience", "social psychology"],
  environment: ["climate change", "sustainability", "environmental science"],
  medicine: ["clinical trials", "epidemiology", "pharmacology"],
  philosophy: ["philosophy of mind", "ethics", "epistemology"],
};

export interface S2Paper {
  externalId: string;
  title: string;
  abstract: string | null;
  authors: { name: string; authorId?: string }[];
  year: number | null;
  citationCount: number;
  influentialCitationCount: number;
  venue: string | null;
  isOpenAccess: boolean;
  fullPaperUrl: string;
  pdfUrl: string | null;
}

export async function searchPapers(
  query: string,
  limit: number = 50,
  offset: number = 0
): Promise<S2Paper[]> {
  const params = new URLSearchParams({
    query,
    offset: String(offset),
    limit: String(limit),
    fields:
      "title,abstract,authors,year,citationCount,influentialCitationCount,venue,isOpenAccess,externalIds,openAccessPdf",
  });

  const headers: Record<string, string> = {};
  if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
    headers["x-api-key"] = process.env.SEMANTIC_SCHOLAR_API_KEY;
  }

  const response = await fetch(`${S2_API_URL}/paper/search?${params}`, {
    headers,
  });

  if (!response.ok) {
    if (response.status === 429) {
      // Rate limited — wait and retry once
      await new Promise((r) => setTimeout(r, 3000));
      const retry = await fetch(`${S2_API_URL}/paper/search?${params}`, {
        headers,
      });
      if (!retry.ok) throw new Error(`S2 API error: ${retry.status}`);
      const data = await retry.json();
      return parsePapers(data.data ?? []);
    }
    throw new Error(`S2 API error: ${response.status}`);
  }

  const data = await response.json();
  return parsePapers(data.data ?? []);
}

function parsePapers(raw: any[]): S2Paper[] {
  return raw
    .filter((p) => p.title && (p.abstract || p.citationCount > 0))
    .map((p) => ({
      externalId: `s2:${p.paperId}`,
      title: p.title,
      abstract: p.abstract ?? null,
      authors: (p.authors ?? []).map((a: any) => ({
        name: a.name,
        authorId: a.authorId,
      })),
      year: p.year ?? null,
      citationCount: p.citationCount ?? 0,
      influentialCitationCount: p.influentialCitationCount ?? 0,
      venue: p.venue || null,
      isOpenAccess: p.isOpenAccess ?? false,
      fullPaperUrl: `https://www.semanticscholar.org/paper/${p.paperId}`,
      pdfUrl: p.openAccessPdf?.url ?? null,
    }));
}
