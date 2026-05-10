import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  date,
  real,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

// ============================================================
// FIELDS / CATEGORIES
// ============================================================
export const fields = pgTable("fields", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon"),
  description: text("description"),
  color: text("color"),
});

// ============================================================
// PAPERS
// ============================================================
export const papers = pgTable(
  "papers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalId: text("external_id").notNull().unique(),
    source: text("source").notNull(), // "arxiv" | "semantic_scholar"
    title: text("title").notNull(),
    abstract: text("abstract"),
    aiSummary: text("ai_summary"),
    aiSummaryAt: timestamp("ai_summary_at", { withTimezone: true }),
    fullPaperUrl: text("full_paper_url").notNull(),
    pdfUrl: text("pdf_url"),
    fieldId: integer("field_id").references(() => fields.id),
    subFields: text("sub_fields").array(),
    year: integer("year"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    citationCount: integer("citation_count").default(0),
    influentialCitations: integer("influential_citations").default(0),
    venue: text("venue"),
    isOpenAccess: boolean("is_open_access").default(true),
    qualityScore: real("quality_score"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_papers_field_id").on(table.fieldId),
    index("idx_papers_published_at").on(table.publishedAt),
    index("idx_papers_quality_score").on(table.qualityScore),
  ]
);

// ============================================================
// AUTHORS
// ============================================================
export const authors = pgTable("authors", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: text("external_id").unique(),
  name: text("name").notNull(),
  affiliation: text("affiliation"),
  hIndex: integer("h_index"),
});

export const paperAuthors = pgTable(
  "paper_authors",
  {
    paperId: uuid("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "cascade" }),
    position: integer("position"),
  },
  (table) => [primaryKey({ columns: [table.paperId, table.authorId] })]
);

// ============================================================
// CITATIONS
// ============================================================
export const paperCitations = pgTable(
  "paper_citations",
  {
    citingPaperId: uuid("citing_paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    citedPaperId: uuid("cited_paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.citingPaperId, table.citedPaperId] }),
  ]
);

// ============================================================
// USERS
// ============================================================
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  dailyGoal: integer("daily_goal").default(3),
  onboardingDone: boolean("onboarding_done").default(false),
  timezone: text("timezone").default("UTC"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================================
// USER INTERESTS
// ============================================================
export const userInterests = pgTable(
  "user_interests",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fieldId: integer("field_id")
      .notNull()
      .references(() => fields.id),
    weight: real("weight").default(1.0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.fieldId] })]
);

// ============================================================
// INTERACTIONS
// ============================================================
export const interactions = pgTable(
  "interactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    paperId: uuid("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "read" | "saved" | "skipped" | "shared"
    readPct: integer("read_pct"),
    interactionAt: timestamp("interaction_at", {
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_interactions_unique").on(
      table.userId,
      table.paperId,
      table.type
    ),
    index("idx_interactions_user_id").on(table.userId),
    index("idx_interactions_paper_id").on(table.paperId),
  ]
);

// ============================================================
// DAILY FEEDS
// ============================================================
export const dailyFeeds = pgTable(
  "daily_feeds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    paperId: uuid("paper_id").references(() => papers.id),
    feedDate: date("feed_date").notNull(),
    position: integer("position"),
    wasServed: boolean("was_served").default(true),
  },
  (table) => [
    uniqueIndex("idx_daily_feeds_unique").on(
      table.userId,
      table.paperId,
      table.feedDate
    ),
    index("idx_daily_feeds_user_date").on(table.userId, table.feedDate),
  ]
);

// ============================================================
// STREAKS
// ============================================================
export const streaks = pgTable("streaks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActiveDate: date("last_active_date"),
  gracePeriodUsed: boolean("grace_period_used").default(false),
  totalPapersRead: integer("total_papers_read").default(0),
  totalDaysActive: integer("total_days_active").default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============================================================
// STREAK DAYS
// ============================================================
export const streakDays = pgTable(
  "streak_days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    papersRead: integer("papers_read").default(0),
    goalMet: boolean("goal_met").default(false),
  },
  (table) => [
    uniqueIndex("idx_streak_days_unique").on(table.userId, table.date),
    index("idx_streak_days_user_date").on(table.userId, table.date),
  ]
);

// ============================================================
// BADGES
// ============================================================
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  threshold: integer("threshold"),
});

export const userBadges = pgTable(
  "user_badges",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: integer("badge_id")
      .notNull()
      .references(() => badges.id),
    earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.badgeId] })]
);
