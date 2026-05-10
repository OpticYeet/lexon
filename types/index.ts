export interface Field {
  id: number;
  slug: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface Paper {
  id: string;
  externalId: string;
  source: "arxiv" | "semantic_scholar";
  title: string;
  abstract: string | null;
  aiSummary: string | null;
  aiSummaryAt: Date | null;
  fullPaperUrl: string;
  pdfUrl: string | null;
  fieldId: number;
  subFields: string[];
  year: number | null;
  publishedAt: Date | null;
  citationCount: number;
  influentialCitations: number;
  venue: string | null;
  isOpenAccess: boolean;
  qualityScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Author {
  id: string;
  externalId: string | null;
  name: string;
  affiliation: string | null;
  hIndex: number | null;
}

export interface PaperWithAuthors extends Paper {
  authors: Author[];
  field: Field;
}

export interface User {
  id: string;
  clerkUserId: string;
  email: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  dailyGoal: number;
  onboardingDone: boolean;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInterest {
  userId: string;
  fieldId: number;
  weight: number;
  createdAt: Date;
}

export interface Interaction {
  id: string;
  userId: string;
  paperId: string;
  type: "read" | "saved" | "skipped" | "shared";
  readPct: number | null;
  interactionAt: Date;
}

export interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  gracePeriodUsed: boolean;
  totalPapersRead: number;
  totalDaysActive: number;
  updatedAt: Date;
}

export interface StreakDay {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  papersRead: number;
  goalMet: boolean;
}

export interface Badge {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
}

export interface DailyFeedItem {
  id: string;
  userId: string;
  paperId: string;
  feedDate: string; // YYYY-MM-DD
  position: number;
  wasServed: boolean;
}

// API response types
export interface FeedResponse {
  papers: PaperWithAuthors[];
  progress: {
    read: number;
    goal: number;
    streakActive: boolean;
  };
}

export interface EndlessFeedResponse {
  papers: PaperWithAuthors[];
  nextCursor: string | null;
}

export interface StreakResponse {
  currentStreak: number;
  longestStreak: number;
  totalPapersRead: number;
  totalDaysActive: number;
  todayProgress: {
    read: number;
    goal: number;
    goalMet: boolean;
  };
  gracePeriodUsed: boolean;
}
