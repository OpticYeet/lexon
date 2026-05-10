import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { fields } from "./schema";

const FIELDS_DATA = [
  {
    slug: "biology",
    name: "Biology / Life Sciences",
    icon: "leaf",
    description: "Genetics, ecology, cell biology, evolution, and more",
    color: "#4A7C59",
  },
  {
    slug: "physics",
    name: "Physics / Astrophysics",
    icon: "atom",
    description: "Quantum mechanics, relativity, cosmology, and particle physics",
    color: "#2B5F8E",
  },
  {
    slug: "chemistry",
    name: "Chemistry / Materials Science",
    icon: "flask",
    description: "Organic, inorganic, physical chemistry, and novel materials",
    color: "#8B5E3C",
  },
  {
    slug: "mathematics",
    name: "Mathematics / Statistics",
    icon: "sigma",
    description: "Pure math, applied math, probability, and statistical methods",
    color: "#7B5EA7",
  },
  {
    slug: "cs-ai",
    name: "Computer Science / AI",
    icon: "cpu",
    description: "Machine learning, NLP, computer vision, and algorithms",
    color: "#C4622D",
  },
  {
    slug: "economics",
    name: "Economics / Social Sciences",
    icon: "chart",
    description: "Microeconomics, macroeconomics, behavioral economics, and policy",
    color: "#2A7A6B",
  },
  {
    slug: "psychology",
    name: "Psychology / Neuroscience",
    icon: "brain",
    description: "Cognitive science, clinical psychology, and brain research",
    color: "#9B4D6E",
  },
  {
    slug: "environment",
    name: "Environmental Science / Climate",
    icon: "globe",
    description: "Climate change, sustainability, ecology, and earth systems",
    color: "#3D7A45",
  },
  {
    slug: "medicine",
    name: "Medicine / Public Health",
    icon: "heart",
    description: "Clinical research, epidemiology, pharmacology, and health policy",
    color: "#C14B4B",
  },
  {
    slug: "philosophy",
    name: "Philosophy / Cognitive Science",
    icon: "lightbulb",
    description: "Ethics, epistemology, philosophy of mind, and logic",
    color: "#6B6B3D",
  },
];

async function seedFields() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log("Seeding fields...");

  for (const field of FIELDS_DATA) {
    await db.insert(fields).values(field).onConflictDoNothing();
  }

  console.log(`Seeded ${FIELDS_DATA.length} fields.`);
}

seedFields().catch(console.error);
