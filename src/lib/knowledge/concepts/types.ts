export type ConceptCategory = "finance" | "investments" | "portfolio" | "markets" | "analysis" | "regulation" | "personal" | "careers";
export interface ConceptEntry {
  id: string;
  en: string;
  he: string;
  aliases: string[];
  category: ConceptCategory;
  /** ids of related concepts (the concept graph). */
  related: string[];
  /** tool paths that work with this concept (calculator, research, ...). */
  tools: string[];
  /** English label of the existing explanation in financialEducation, or null when there is no text yet. */
  explain: string | null;
}
