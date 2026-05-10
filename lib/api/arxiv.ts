const ARXIV_API_URL = "http://export.arxiv.org/api/query";

// arXiv categories mapped to our fields
export const ARXIV_CATEGORIES: Record<string, string[]> = {
  "cs-ai": ["cs.AI", "cs.LG", "cs.CL", "cs.CV", "cs.NE"],
  biology: ["q-bio.GN", "q-bio.MN", "q-bio.PE", "q-bio.CB"],
  physics: ["astro-ph", "cond-mat", "quant-ph", "hep-ph", "physics.gen-ph"],
  mathematics: ["math.ST", "math.CO", "math.PR", "math.AG"],
  chemistry: ["physics.chem-ph"],
  economics: ["econ.GN", "econ.EM", "econ.TH"],
  environment: ["physics.ao-ph", "physics.geo-ph"],
};

export interface ArxivPaper {
  externalId: string;
  title: string;
  abstract: string;
  authors: { name: string }[];
  publishedAt: string;
  fullPaperUrl: string;
  pdfUrl: string;
  categories: string[];
}

export async function fetchArxivPapers(
  category: string,
  maxResults: number = 50,
  start: number = 0
): Promise<ArxivPaper[]> {
  const url = `${ARXIV_API_URL}?search_query=cat:${category}&start=${start}&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`arXiv API error: ${response.status}`);
  }

  const xml = await response.text();
  return parseArxivXml(xml);
}

function parseArxivXml(xml: string): ArxivPaper[] {
  const papers: ArxivPaper[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    const id = extractTag(entry, "id") ?? "";
    const arxivId = id.replace("http://arxiv.org/abs/", "").replace(/v\d+$/, "");
    const title = (extractTag(entry, "title") ?? "").replace(/\s+/g, " ").trim();
    const abstract = (extractTag(entry, "summary") ?? "").replace(/\s+/g, " ").trim();
    const published = extractTag(entry, "published") ?? "";

    // Extract authors
    const authorRegex = /<author>\s*<name>(.*?)<\/name>/g;
    const authors: { name: string }[] = [];
    let authorMatch;
    while ((authorMatch = authorRegex.exec(entry)) !== null) {
      authors.push({ name: authorMatch[1].trim() });
    }

    // Extract categories
    const catRegex = /category term="([^"]+)"/g;
    const categories: string[] = [];
    let catMatch;
    while ((catMatch = catRegex.exec(entry)) !== null) {
      categories.push(catMatch[1]);
    }

    // Extract PDF link
    const pdfLinkMatch = entry.match(
      /<link[^>]*title="pdf"[^>]*href="([^"]+)"/
    );
    const pdfUrl = pdfLinkMatch ? pdfLinkMatch[1] : `https://arxiv.org/pdf/${arxivId}`;

    if (title && abstract) {
      papers.push({
        externalId: `arxiv:${arxivId}`,
        title,
        abstract,
        authors,
        publishedAt: published,
        fullPaperUrl: `https://arxiv.org/abs/${arxivId}`,
        pdfUrl,
        categories,
      });
    }
  }

  return papers;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const match = xml.match(regex);
  return match ? match[1] : null;
}
