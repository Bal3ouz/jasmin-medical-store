// Extended category seed — additional sub-categories beyond the base tree.
// Composed by the integrator alongside CATEGORY_SEED.

export interface CategorySeed {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  parentId: string | null;
  displayOrder: number;
}

// Parent IDs from the existing CATEGORY_SEED:
//   parapharmacie     = c0000000-0000-4000-8000-000000000004
//   materiel-medical  = c0000000-0000-4000-8000-000000000003

export const EXTENDED_CATEGORY_SEED: CategorySeed[] = [
  {
    id: "c0000000-0000-4000-8000-000000000044",
    slug: "hygiene-intime",
    name: "Hygiène intime",
    description: "Soins lavants et apaisants pour la zone intime.",
    parentId: "c0000000-0000-4000-8000-000000000004",
    displayOrder: 4,
  },
  {
    id: "c0000000-0000-4000-8000-000000000035",
    slug: "protection-respiratoire",
    name: "Protection respiratoire",
    description: "Masques chirurgicaux, FFP2, gants d'examen.",
    parentId: "c0000000-0000-4000-8000-000000000003",
    displayOrder: 5,
  },
];
