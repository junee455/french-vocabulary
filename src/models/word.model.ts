export const FrenchVerbForms = [
  "infinitiv",
  "je",
  "tu",
  "il/elle",
  "nous",
  "vous",
  "ils/elles",
  "imperatif",
] as const;

export const FrenchNounForms = ["masculine", "feminine"] as const;

export const WordType = ["noun", "verb", "unknown"] as const;

export type FrenchVerb = {
  [P in typeof FrenchVerbForms[number]]?: string;
} & {
  type: "verb";
};

export type FrenchNoun = {
  [P in typeof FrenchNounForms[number]]?: string;
} & {
  type: "noun";
};

export type UnknownWord = {
  word: string;
  type: "unknown";
};

export interface Word {
  french?: FrenchVerb | FrenchNoun | UnknownWord;
  translation?: string;
}
