// Extended brand seed — additional brands needed to cover medical-device,
// baby care, hair care, hygiene and supplement product lines.
// Composed by the integrator alongside BRAND_SEED.

export interface BrandSeed {
  id: string;
  slug: string;
  name: string;
  description: string;
  websiteUrl?: string;
}

export const EXTENDED_BRAND_SEED: BrandSeed[] = [
  {
    id: "b0000000-0000-4000-8000-000000000010",
    slug: "omron",
    name: "Omron Healthcare",
    description:
      "Spécialiste japonais des appareils de mesure médicale : tensiomètres, thermomètres et nébuliseurs.",
    websiteUrl: "https://www.omron-healthcare.com",
  },
  {
    id: "b0000000-0000-4000-8000-000000000011",
    slug: "accu-chek",
    name: "Accu-Chek",
    description:
      "Solutions Roche Diabetes Care pour l'autosurveillance glycémique : lecteurs, bandelettes et lancettes.",
    websiteUrl: "https://www.accu-chek.com",
  },
  {
    id: "b0000000-0000-4000-8000-000000000012",
    slug: "beurer",
    name: "Beurer",
    description:
      "Fabricant allemand d'appareils de santé et bien-être : oxymètres, balances, aérosols et chauffe-corps.",
    websiteUrl: "https://www.beurer.com",
  },
  {
    id: "b0000000-0000-4000-8000-000000000013",
    slug: "microlife",
    name: "Microlife",
    description:
      "Suisse — thermomètres infrarouges sans contact et tensiomètres certifiés cliniquement.",
    websiteUrl: "https://www.microlife.com",
  },
  {
    id: "b0000000-0000-4000-8000-000000000014",
    slug: "thuasne",
    name: "Thuasne",
    description:
      "Orthopédie française depuis 1847 : ceintures lombaires, genouillères, chevillères et orthèses.",
    websiteUrl: "https://www.thuasne.com",
  },
  {
    id: "b0000000-0000-4000-8000-000000000015",
    slug: "epitact",
    name: "Epitact",
    description:
      "Solutions podologiques et orthopédiques : protections, orthèses, chevillères avec gel Epithelium.",
    websiteUrl: "https://www.epitact.fr",
  },
  {
    id: "b0000000-0000-4000-8000-000000000016",
    slug: "mustela",
    name: "Mustela",
    description:
      "Soins dermatologiques pour bébés, enfants et futures mamans depuis plus de 70 ans.",
    websiteUrl: "https://www.mustela.com",
  },
  {
    id: "b0000000-0000-4000-8000-000000000017",
    slug: "forte-pharma",
    name: "Forté Pharma",
    description:
      "Compléments alimentaires monégasques : vitalité, minceur, sommeil, immunité.",
    websiteUrl: "https://www.forte-pharma.com",
  },
  {
    id: "b0000000-0000-4000-8000-000000000018",
    slug: "saforelle",
    name: "Saforelle",
    description:
      "Hygiène intime et dermo-cosmétique à base d'extrait de Bardane.",
    websiteUrl: "https://www.saforelle.fr",
  },
  {
    id: "b0000000-0000-4000-8000-000000000019",
    slug: "klorane",
    name: "Klorane",
    description:
      "Soins capillaires et corporels d'origine végétale, laboratoires Pierre Fabre.",
    websiteUrl: "https://www.klorane.com",
  },
  {
    id: "b0000000-0000-4000-8000-00000000001a",
    slug: "ducray",
    name: "Ducray",
    description:
      "Dermo-cosmétique cuir chevelu et soins ciblés, laboratoires Pierre Fabre.",
    websiteUrl: "https://www.ducray.com",
  },
  {
    id: "b0000000-0000-4000-8000-00000000001b",
    slug: "phyto",
    name: "Phyto",
    description:
      "Soins capillaires d'expertise botanique, traitements anti-chute et beauté du cheveu.",
    websiteUrl: "https://www.phyto.com",
  },
  {
    id: "b0000000-0000-4000-8000-00000000001c",
    slug: "aderma",
    name: "A-Derma",
    description:
      "Soins dermatologiques à l'avoine Rhealba pour peaux fragiles et atopiques.",
    websiteUrl: "https://www.aderma.com",
  },
  {
    id: "b0000000-0000-4000-8000-00000000001d",
    slug: "roger-gallet",
    name: "Roger & Gallet",
    description:
      "Maison de parfumerie française fondée en 1862 : eaux parfumées, savons et soins corps.",
    websiteUrl: "https://fr.roger-gallet.com",
  },
  {
    id: "b0000000-0000-4000-8000-00000000001e",
    slug: "herbi-feet",
    name: "Herbi Feet",
    description:
      "Solutions podologiques en silicone : semelles, protections d'oignon, séparateurs d'orteils.",
    websiteUrl: "https://www.herbifeet.com",
  },
];
