// Extended product seed — 50 real, currently-sold parapharmacy and medical
// products covering Cosmétique, Orthopédie, Matériel médical and
// Parapharmacie générale. Composed by the integrator alongside PRODUCT_SEED.
//
// Image URLs prefer parashop.tn (a major Tunisian online parapharmacy) since
// their /image/cache/catalog/produits/{brand}/{slug}-550x550.jpg pattern is
// stable and corresponds to slugs we have verified through search. Where a
// reliable URL could not be located, imageUrl is left undefined and the
// download script will fall back to a branded placeholder.

import type { SeedProduct } from "./products";

const cosVisage = "visage";
const cosCorps = "corps";
const cosSolaire = "solaire";
const cosCheveux = "cheveux";

const PARASHOP = "https://www.parashop.tn/image/cache/catalog/produits";

export const EXTENDED_PRODUCT_SEED: SeedProduct[] = [
  // ============================================================
  // COSMÉTIQUE — VISAGE (12)
  // ============================================================

  // 1. Avène Cleanance Gel Nettoyant — 200/400ml variants
  {
    id: "70000000-0000-4000-8000-00000000010a",
    slug: "avene-cleanance-gel-nettoyant",
    name: "Avène Cleanance Gel Nettoyant",
    brandSlug: "avene",
    categorySlug: cosVisage,
    shortDescription:
      "Gel moussant doux pour peaux mixtes à grasses sujettes aux imperfections.",
    description:
      "Sans savon, ce gel élimine excès de sébum et impuretés sans dessécher. Sa base lavante respecte le pH cutané et apaise grâce à l'eau thermale d'Avène. Texture fraîche, rinçage facile.",
    ingredients:
      "Eau thermale d'Avène, Cocamidopropyl betaine, Glycérine, Monolaurine, Acide salicylique.",
    usage:
      "Matin et soir, faire mousser dans les mains humides et appliquer sur le visage en évitant le contour des yeux. Rincer à l'eau claire.",
    hasVariants: true,
    reorderPoint: 6,
    initialStock: 28,
    variants: [
      { sku: "AVE-CLN-200", name: "200ml", priceTnd: "42.500", isDefault: true },
      { sku: "AVE-CLN-400", name: "400ml", priceTnd: "58.900" },
    ],
    imageUrl: `${PARASHOP}/avene/avene-cleanance-gel-nettoyant-400-ml-550x550.jpg`,
    imageAlt: "Flacon Avène Cleanance Gel Nettoyant",
  },

  // 2. Avène Hydrance Riche
  {
    id: "70000000-0000-4000-8000-00000000010b",
    slug: "avene-hydrance-riche-creme-40ml",
    name: "Avène Hydrance Riche Crème Hydratante 40ml",
    brandSlug: "avene",
    categorySlug: cosVisage,
    shortDescription:
      "Crème hydratante riche pour peaux sensibles sèches à très sèches.",
    description:
      "Texture nourrissante au beurre de karité, hydrate intensément et restaure la barrière cutanée. Apaise les tiraillements grâce à l'eau thermale d'Avène. Non comédogène, sans parfum.",
    ingredients:
      "Eau thermale d'Avène, beurre de karité, glycérine, complexe Cohéderm.",
    usage:
      "Appliquer matin et/ou soir sur visage et cou parfaitement nettoyés.",
    hasVariants: false,
    sku: "AVE-HYR-40",
    priceTnd: "44.900",
    reorderPoint: 5,
    initialStock: 18,
    imageUrl: `${PARASHOP}/avene/avene-hydrance-riche-creme-hydratante-40ml-550x550.jpg`,
    imageAlt: "Tube Avène Hydrance Riche 40ml",
  },

  // 3. Avène Tolérance Control crème apaisante
  {
    id: "70000000-0000-4000-8000-00000000010c",
    slug: "avene-tolerance-control-creme-40ml",
    name: "Avène Tolérance Control Crème Apaisante 40ml",
    brandSlug: "avene",
    categorySlug: cosVisage,
    shortDescription:
      "Crème apaisante restauratrice pour peaux réactives et intolérantes.",
    description:
      "Formule minimaliste en Cosmétique Stérile®, sans conservateur ni parfum. Apaise les rougeurs et inconforts dès la première application, restaure la barrière cutanée.",
    ingredients:
      "Eau thermale d'Avène, D-sensinose, complexe post-biotique.",
    usage: "Appliquer matin et/ou soir sur peau propre.",
    hasVariants: false,
    sku: "AVE-TOL-40",
    priceTnd: "62.500",
    reorderPoint: 4,
    initialStock: 12,
    imageUrl: `${PARASHOP}/avene/avene-tolerance-control-creme-apaisante-restauratrice-40ml-550x550.jpg`,
    imageAlt: "Flacon Avène Tolérance Control",
  },

  // 4. La Roche-Posay Effaclar Gel Moussant Purifiant
  {
    id: "70000000-0000-4000-8000-00000000010d",
    slug: "lrp-effaclar-gel-moussant-purifiant",
    name: "La Roche-Posay Effaclar Gel Moussant Purifiant",
    brandSlug: "la-roche-posay",
    categorySlug: cosVisage,
    shortDescription:
      "Gel moussant purifiant pour peaux grasses à imperfections.",
    description:
      "Au zinc PCA, élimine en douceur l'excès de sébum et les impuretés sans dessécher. pH physiologique, sans savon. Convient aux peaux sensibles à tendance acnéique.",
    ingredients:
      "Eau thermale La Roche-Posay, zinc PCA, agents lavants doux.",
    usage:
      "Faire mousser dans les mains humides et masser visage et cou. Rincer abondamment.",
    hasVariants: true,
    reorderPoint: 6,
    initialStock: 24,
    variants: [
      { sku: "LRP-EGM-200", name: "200ml", priceTnd: "39.900", isDefault: true },
      { sku: "LRP-EGM-400", name: "400ml", priceTnd: "62.000" },
    ],
    imageUrl: `${PARASHOP}/laroche-posay/la-roche-posay-effaclar-gel-moussant-purifiant-400ml-550x550.jpg`,
    imageAlt: "Flacon La Roche-Posay Effaclar Gel Moussant",
  },

  // 5. La Roche-Posay Effaclar Duo SPF30
  {
    id: "70000000-0000-4000-8000-00000000010e",
    slug: "lrp-effaclar-duo-spf30",
    name: "La Roche-Posay Effaclar Duo+ SPF30 40ml",
    brandSlug: "la-roche-posay",
    categorySlug: cosVisage,
    shortDescription:
      "Soin anti-imperfections protégé SPF30 pour peaux à tendance acnéique.",
    description:
      "Triple correction : imperfections, marques résiduelles et points noirs. La protection SPF30 limite les hyperpigmentations post-inflammatoires. Texture fluide non grasse.",
    ingredients:
      "Niacinamide, acide salicylique, LHA, procérad, filtres UVA/UVB.",
    usage: "Appliquer le matin sur peau propre, avant le maquillage.",
    hasVariants: false,
    sku: "LRP-EFD-SPF30-40",
    priceTnd: "55.900",
    reorderPoint: 4,
    initialStock: 14,
    imageUrl: `${PARASHOP}/laroche-posay/la-roche-posay-effaclar-duo-spf30-soin-anti-imperfections-40ml-550x550.jpg`,
    imageAlt: "Tube La Roche-Posay Effaclar Duo+ SPF30",
  },

  // 6. La Roche-Posay Cicaplast Baume B5+ — 40/100ml
  {
    id: "70000000-0000-4000-8000-00000000010f",
    slug: "lrp-cicaplast-baume-b5plus",
    name: "La Roche-Posay Cicaplast Baume B5+",
    brandSlug: "la-roche-posay",
    categorySlug: cosVisage,
    shortDescription:
      "Baume réparateur multi-usage pour toute la famille.",
    description:
      "Formule enrichie en panthénol, madécassoside et tribioma. Apaise et répare les irritations, brûlures superficielles, peaux fragilisées par les soins dermatologiques. Convient bébé, enfant, adulte.",
    ingredients:
      "Eau thermale La Roche-Posay, panthénol 5%, madécassoside, tribioma.",
    usage:
      "Appliquer en couche fine sur la zone à traiter, 1 à 2 fois par jour.",
    hasVariants: true,
    reorderPoint: 6,
    initialStock: 24,
    variants: [
      { sku: "LRP-CIC-40", name: "40ml", priceTnd: "29.500", isDefault: true },
      { sku: "LRP-CIC-100", name: "100ml", priceTnd: "55.900" },
    ],
    imageUrl: `${PARASHOP}/laroche-posay/la-roche-posay-cicaplast-baume-b5-100-ml-550x550.jpg`,
    imageAlt: "Tube La Roche-Posay Cicaplast Baume B5+",
  },

  // 7. Vichy Liftactiv Collagen Specialist
  {
    id: "70000000-0000-4000-8000-000000000110",
    slug: "vichy-liftactiv-collagen-specialist",
    name: "Vichy Liftactiv Collagen Specialist Crème 50ml",
    brandSlug: "vichy",
    categorySlug: cosVisage,
    shortDescription:
      "Crème anti-rides redensifiante au complexe peptidique et vitamine C.",
    description:
      "Cible la perte de fermeté et le manque d'éclat lié au déficit de collagène. Combine peptides Pro-Collagène et vitamine C pour une peau visiblement plus ferme et lumineuse.",
    ingredients:
      "Peptides Pro-Collagène, Vitamine C 5%, eau volcanique de Vichy.",
    usage: "Appliquer matin sur visage et cou.",
    hasVariants: false,
    sku: "VIC-LCS-50",
    priceTnd: "129.000",
    reorderPoint: 3,
    initialStock: 8,
    imageUrl: `${PARASHOP}/vichy/vichy-liftactiv-collagen-specialist-creme-anti-age-550x550.jpg`,
    imageAlt: "Pot Vichy Liftactiv Collagen Specialist",
  },

  // 8. Vichy Liftactiv Specialist B3 Sérum
  {
    id: "70000000-0000-4000-8000-000000000111",
    slug: "vichy-liftactiv-specialist-b3-serum",
    name: "Vichy Liftactiv Specialist B3 Sérum 30ml",
    brandSlug: "vichy",
    categorySlug: cosVisage,
    shortDescription:
      "Sérum anti-taches brunes et anti-rides à la niacinamide pure.",
    description:
      "Concentré en niacinamide à 5% et acide hyaluronique, atténue visiblement les taches pigmentaires et les rides en 8 semaines. Tolérance optimale, convient à toutes peaux.",
    ingredients:
      "Niacinamide (Vitamine B3) 5%, acide hyaluronique, peptides.",
    usage:
      "Appliquer matin et soir, 3 à 4 gouttes sur visage et cou nettoyés.",
    hasVariants: false,
    sku: "VIC-LB3-30",
    priceTnd: "159.000",
    reorderPoint: 3,
    initialStock: 8,
    imageUrl: `${PARASHOP}/vichy/vichy-liftactiv-specialist-b3-serum-30ml-550x550.jpg`,
    imageAlt: "Flacon Vichy Liftactiv Specialist B3 Sérum",
  },

  // 9. Bioderma Sensibio H2O — 250/500ml
  {
    id: "70000000-0000-4000-8000-000000000112",
    slug: "bioderma-sensibio-h2o-eau-micellaire",
    name: "Bioderma Sensibio H2O Eau Micellaire",
    brandSlug: "bioderma",
    categorySlug: cosVisage,
    shortDescription:
      "Solution micellaire démaquillante pour peaux sensibles.",
    description:
      "Démaquille, nettoie et apaise sans rincer. Le complexe breveté D.A.F.® booste la tolérance des peaux les plus sensibles. Sans parfum, sans paraben.",
    ingredients:
      "Esters de PEG, complexe D.A.F.®, eau, sans alcool.",
    usage:
      "Imprégner un coton et passer sur visage et yeux. Pas de rinçage nécessaire.",
    hasVariants: true,
    reorderPoint: 8,
    initialStock: 36,
    variants: [
      { sku: "BIO-SH2O-250", name: "250ml", priceTnd: "29.500" },
      { sku: "BIO-SH2O-500", name: "500ml", priceTnd: "52.900", isDefault: true },
    ],
    imageUrl: `${PARASHOP}/bioderma/bioderma-sensibio-h2o-solution-micellaire-500ml-550x550.jpg`,
    imageAlt: "Flacon Bioderma Sensibio H2O 500ml",
  },

  // 10. Bioderma Sébium Hydra
  {
    id: "70000000-0000-4000-8000-000000000113",
    slug: "bioderma-sebium-hydra",
    name: "Bioderma Sébium Hydra Crème Hydratante 40ml",
    brandSlug: "bioderma",
    categorySlug: cosVisage,
    shortDescription:
      "Hydratation compensatrice pour peaux mixtes à grasses déshydratées.",
    description:
      "Restaure le confort des peaux desséchées par les traitements anti-acné. Texture légère non comédogène, hydrate 24h tout en matifiant.",
    ingredients:
      "Complexe Fluidactiv®, vitamine E, glycérine.",
    usage: "Appliquer matin et soir sur peau nettoyée.",
    hasVariants: false,
    sku: "BIO-SBH-40",
    priceTnd: "42.500",
    reorderPoint: 4,
    initialStock: 14,
    imageUrl: `${PARASHOP}/bioderma/bioderma-sebium-hydra-creme-40ml-550x550.jpg`,
    imageAlt: "Tube Bioderma Sébium Hydra",
  },

  // 11. Nuxe Crème Prodigieuse Boost Sérum-Huile
  {
    id: "70000000-0000-4000-8000-000000000114",
    slug: "nuxe-creme-prodigieuse-boost-serum-huile",
    name: "Nuxe Crème Prodigieuse Boost Sérum-Huile 30ml",
    brandSlug: "nuxe",
    categorySlug: cosVisage,
    shortDescription:
      "Concentré multi-correction premiers signes de l'âge.",
    description:
      "Texture sérum-huile fondante, lisse les ridules, redensifie et illumine. À base d'huile de noisette du Piémont et de complexe anti-pollution.",
    ingredients:
      "Huile de noisette, vitamine E, complexe Multi-Correction Boost.",
    usage:
      "Appliquer matin et/ou soir sur visage, cou et décolleté avant la crème.",
    hasVariants: false,
    sku: "NUX-CPB-30",
    priceTnd: "139.000",
    reorderPoint: 3,
    initialStock: 9,
    imageUrl: `${PARASHOP}/nuxe/nuxe-creme-prodigieuse-boost-serum-huile-30ml-550x550.jpg`,
    imageAlt: "Flacon Nuxe Crème Prodigieuse Boost Sérum-Huile",
  },

  // 12. SVR Sensifine Aqua-Gel
  {
    id: "70000000-0000-4000-8000-000000000115",
    slug: "svr-sensifine-aqua-gel-40ml",
    name: "SVR Sensifine Aqua-Gel 40ml",
    brandSlug: "svr",
    categorySlug: cosVisage,
    shortDescription:
      "Soin hydratant frais pour peaux sensibles réactives.",
    description:
      "Texture gel-crème fondante, hydrate intensément et calme les sensations d'inconfort. Sans alcool, sans parfum, sans paraben.",
    ingredients: "Eau thermale SVR, dextran sulfate, glycérine.",
    usage: "Appliquer matin et soir sur visage propre.",
    hasVariants: false,
    sku: "SVR-SAG-40",
    priceTnd: "55.900",
    reorderPoint: 4,
    initialStock: 12,
    imageUrl: `${PARASHOP}/svr/svr-sensifine-aqua-gel-40ml-550x550.jpg`,
    imageAlt: "Tube SVR Sensifine Aqua-Gel",
  },

  // ============================================================
  // COSMÉTIQUE — CORPS (5)
  // ============================================================

  // 13. La Roche-Posay Lipikar Baume AP+M — 200/400ml
  {
    id: "70000000-0000-4000-8000-000000000120",
    slug: "lrp-lipikar-baume-apm",
    name: "La Roche-Posay Lipikar Baume AP+M",
    brandSlug: "la-roche-posay",
    categorySlug: cosCorps,
    shortDescription:
      "Baume relipidant anti-grattage pour peaux sèches à atopiques.",
    description:
      "Espace les poussées de sécheresse extrême et de démangeaisons. Au beurre de karité, niacinamide et microbiome. Convient à toute la famille dès la naissance.",
    ingredients:
      "Eau thermale La Roche-Posay, beurre de karité, niacinamide, microbiome Aqua Posae.",
    usage:
      "Appliquer 1 à 2 fois par jour sur l'ensemble du corps. Insister sur les zones sèches.",
    hasVariants: true,
    reorderPoint: 5,
    initialStock: 22,
    variants: [
      { sku: "LRP-LIP-200", name: "200ml", priceTnd: "82.000", isDefault: true },
      { sku: "LRP-LIP-400", name: "400ml", priceTnd: "115.000" },
    ],
    imageUrl: `${PARASHOP}/laroche-posay/la-roche-posay-lipikar-apm-baume-relipidant-400ml-550x550.jpg`,
    imageAlt: "Flacon La Roche-Posay Lipikar Baume AP+M",
  },

  // 14. Bioderma Atoderm Intensive Baume
  {
    id: "70000000-0000-4000-8000-000000000121",
    slug: "bioderma-atoderm-intensive-baume",
    name: "Bioderma Atoderm Intensive Baume 500ml",
    brandSlug: "bioderma",
    categorySlug: cosCorps,
    shortDescription:
      "Baume ultra-nourrissant anti-grattage peaux atopiques.",
    description:
      "Action immédiate sur les démangeaisons, espace les irritations. Brevet Skin Barrier Therapy® qui restaure durablement la barrière cutanée.",
    ingredients:
      "Vaseline, glycérine, niacinamide, complexe Skin Barrier Therapy®.",
    usage: "Appliquer 1 à 2 fois par jour sur l'ensemble du corps.",
    hasVariants: false,
    sku: "BIO-ATB-500",
    priceTnd: "78.500",
    reorderPoint: 4,
    initialStock: 14,
    imageUrl: `${PARASHOP}/bioderma/bioderma-atoderm-intensive-baume-500ml-550x550.jpg`,
    imageAlt: "Pot Bioderma Atoderm Intensive Baume 500ml",
  },

  // 15. A-Derma Exomega Control crème
  {
    id: "70000000-0000-4000-8000-000000000122",
    slug: "aderma-exomega-control-creme-200ml",
    name: "A-Derma Exomega Control Crème Émolliente 200ml",
    brandSlug: "aderma",
    categorySlug: cosCorps,
    shortDescription:
      "Crème émolliente apaisante pour peaux à tendance atopique.",
    description:
      "Formule Cosmétique Stérile, sans conservateur ni parfum. À base d'avoine Rhealba® et de filaxerine, soulage les démangeaisons et restaure la barrière cutanée.",
    ingredients:
      "Avoine Rhealba®, filaxerine, omégas 6.",
    usage: "Appliquer 1 à 2 fois par jour sur peau propre.",
    hasVariants: false,
    sku: "ADE-EXO-200",
    priceTnd: "70.900",
    reorderPoint: 4,
    initialStock: 14,
    imageUrl: `${PARASHOP}/aderma/aderma-exomega-control-creme-emoliente-200-ml-550x550.jpg`,
    imageAlt: "Tube A-Derma Exomega Control Crème",
  },

  // 16. Nuxe Huile Prodigieuse OR
  {
    id: "70000000-0000-4000-8000-000000000123",
    slug: "nuxe-huile-prodigieuse-or",
    name: "Nuxe Huile Prodigieuse OR",
    brandSlug: "nuxe",
    categorySlug: cosCorps,
    shortDescription:
      "Huile sèche multi-fonctions à paillettes dorées.",
    description:
      "Version scintillante de l'iconique Huile Prodigieuse. Nourrit, adoucit et illumine la peau, le visage et les cheveux. Texture sèche non grasse, parfum sensuel.",
    ingredients:
      "7 huiles botaniques (amande douce, argan, camélia, bourrache, noisette, macadamia, tsubaki).",
    usage:
      "Vaporiser sur visage, corps ou cheveux. Idéale en application post-douche.",
    hasVariants: true,
    reorderPoint: 5,
    initialStock: 16,
    variants: [
      { sku: "NUX-HPO-50", name: "50ml", priceTnd: "55.000" },
      { sku: "NUX-HPO-100", name: "100ml", priceTnd: "89.500", isDefault: true },
    ],
    imageUrl: `${PARASHOP}/nuxe/nuxe-huile-prodigieuse-or-100ml-550x550.jpg`,
    imageAlt: "Flacon Nuxe Huile Prodigieuse OR",
  },

  // 17. Roger & Gallet Bois d'Orange Eau Parfumée
  {
    id: "70000000-0000-4000-8000-000000000124",
    slug: "roger-gallet-bois-orange-eau-parfumee",
    name: "Roger & Gallet Bois d'Orange Eau Parfumée Bienfaisante",
    brandSlug: "roger-gallet",
    categorySlug: cosCorps,
    shortDescription:
      "Eau parfumée bienfaisante aux essences d'orange amère.",
    description:
      "Senteur tonique et énergisante créée par Dominique Ropion. Cœur d'orange juteuse, cœur de petit grain, fond boisé de patchouli. Geste vitaminé matin et soir.",
    ingredients:
      "Essence naturelle d'orange amère, petit grain, patchouli, alcool.",
    usage: "Vaporiser sur la peau et dans les cheveux selon l'envie.",
    hasVariants: true,
    reorderPoint: 4,
    initialStock: 14,
    variants: [
      { sku: "RG-BOR-30", name: "30ml", priceTnd: "59.000" },
      { sku: "RG-BOR-100", name: "100ml", priceTnd: "129.000", isDefault: true },
    ],
    imageUrl: `${PARASHOP}/rogergallet/roger-gallet-bois-d-orange-eau-parfumee-bienfaisante-100ml-550x550.jpg`,
    imageAlt: "Flacon Roger & Gallet Bois d'Orange",
  },

  // ============================================================
  // COSMÉTIQUE — SOLAIRE (3)
  // ============================================================

  // 18. La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF50+
  {
    id: "70000000-0000-4000-8000-000000000130",
    slug: "lrp-anthelios-uvmune-400-fluide",
    name: "La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF50+ 50ml",
    brandSlug: "la-roche-posay",
    categorySlug: cosSolaire,
    shortDescription:
      "Très haute protection visage anti-UVA Ultra-Longs.",
    description:
      "Premier filtre anti-UVA Ultra-Longs Mexoryl 400, protège des dommages cutanés profonds. Texture invisible, non grasse, résistante à l'eau. Adaptée aux peaux sensibles.",
    ingredients:
      "Filtres Mexoryl 400, Mexoryl XL, Tinosorb S, eau thermale La Roche-Posay.",
    usage:
      "Appliquer généreusement avant exposition. Renouveler toutes les 2 heures.",
    hasVariants: false,
    sku: "LRP-ANT-UV4-50",
    priceTnd: "89.500",
    reorderPoint: 4,
    initialStock: 14,
    imageUrl: `${PARASHOP}/laroche-posay/la-roche-posay-anthelios-uvmune-400-invisible-fluide-spf50-550x550.jpg`,
    imageAlt: "Flacon La Roche-Posay Anthelios UVMune 400",
  },

  // 19. Bioderma Photoderm MAX SPF50+ — formats
  {
    id: "70000000-0000-4000-8000-000000000131",
    slug: "bioderma-photoderm-max-spf50",
    name: "Bioderma Photoderm MAX SPF50+",
    brandSlug: "bioderma",
    categorySlug: cosSolaire,
    shortDescription:
      "Photoprotection MAXimale brevet Cellular Bioprotection®.",
    description:
      "Protection très haute UVA/UVB avec brevet Cellular Bioprotection®. Préserve le capital santé de la peau. Disponible en crème, lait corps et fluide aqua.",
    ingredients:
      "Filtres UVA/UVB photostables, vitamine E, complexe Cellular Bioprotection®.",
    usage:
      "Appliquer en couche généreuse 20 min avant exposition. Renouveler après baignade.",
    hasVariants: true,
    reorderPoint: 4,
    initialStock: 16,
    variants: [
      { sku: "BIO-PHO-CR-40", name: "Crème visage 40ml", priceTnd: "47.000", isDefault: true },
      { sku: "BIO-PHO-AQ-40", name: "Aquafluide 40ml", priceTnd: "69.000" },
      { sku: "BIO-PHO-LT-100", name: "Lait corps 100ml", priceTnd: "63.900" },
    ],
    imageUrl: `${PARASHOP}/bioderma/bioderma-photoderm-max-creme-spf50-40ml-550x550.jpg`,
    imageAlt: "Tube Bioderma Photoderm MAX SPF50+",
  },

  // 20. Avène Solaire Crème Minérale
  {
    id: "70000000-0000-4000-8000-000000000132",
    slug: "avene-solaire-mineral-spf50",
    name: "Avène Solaire Crème Minérale Très Haute Protection SPF50+ 50ml",
    brandSlug: "avene",
    categorySlug: cosSolaire,
    shortDescription:
      "Écran minéral 100% pour peaux intolérantes au soleil.",
    description:
      "Filtres 100% minéraux, sans filtre chimique, sans parfum. Idéale pour peaux les plus sensibles ou allergiques au soleil. Texture confort, résistante à l'eau.",
    ingredients:
      "Dioxyde de titane, oxyde de zinc, eau thermale d'Avène, vitamine E.",
    usage:
      "Appliquer généreusement sur peau propre avant exposition.",
    hasVariants: false,
    sku: "AVE-SOL-MIN-50",
    priceTnd: "75.000",
    reorderPoint: 3,
    initialStock: 10,
    imageUrl: `${PARASHOP}/avene/avene-solaire-creme-minerale-spf50-50ml-550x550.jpg`,
    imageAlt: "Tube Avène Solaire Crème Minérale SPF50+",
  },

  // ============================================================
  // COSMÉTIQUE — CHEVEUX (5)
  // ============================================================

  // 21. Vichy Dercos Anti-Pelliculaire
  {
    id: "70000000-0000-4000-8000-000000000140",
    slug: "vichy-dercos-anti-pelliculaire",
    name: "Vichy Dercos Shampooing Anti-Pelliculaire DS",
    brandSlug: "vichy",
    categorySlug: cosCheveux,
    shortDescription:
      "Shampooing traitant antipelliculaire au sulfure de sélénium.",
    description:
      "Élimine les pellicules visibles dès la première utilisation. Apaise les démangeaisons et le cuir chevelu sensible. Disponible cheveux normaux à gras ou cheveux secs.",
    ingredients:
      "Sulfure de sélénium 1%, eau thermale de Vichy, salicylate.",
    usage:
      "Appliquer sur cheveux mouillés, masser, laisser poser 2 minutes, rincer. 2 fois par semaine.",
    hasVariants: true,
    reorderPoint: 5,
    initialStock: 22,
    variants: [
      { sku: "VIC-DER-AP-NG", name: "Cheveux normaux à gras 200ml", priceTnd: "46.500", isDefault: true },
      { sku: "VIC-DER-AP-CS", name: "Cheveux secs 200ml", priceTnd: "46.500" },
      { sku: "VIC-DER-AP-390", name: "Cheveux secs 390ml", priceTnd: "78.000" },
    ],
    imageUrl: `${PARASHOP}/vichy/vichy-dercos-anti-pelliculaire-shampooing-traitant-cheveux-secs-550x550.jpg`,
    imageAlt: "Flacon Vichy Dercos Anti-Pelliculaire",
  },

  // 22. Klorane Shampooing Quinine fortifiant
  {
    id: "70000000-0000-4000-8000-000000000141",
    slug: "klorane-shampooing-quinine",
    name: "Klorane Shampooing Fortifiant à la Quinine et Vitamines B",
    brandSlug: "klorane",
    categorySlug: cosCheveux,
    shortDescription:
      "Shampooing fortifiant cheveux fatigués à tendance à tomber.",
    description:
      "Stimule et fortifie le cheveu dès la racine. À l'écorce de quinine et vitamines B. Sans silicone, sans paraben.",
    ingredients:
      "Extrait de quinine, vitamines B5/B6/B8, edelweiss bio.",
    usage:
      "Appliquer sur cheveux mouillés, masser, laisser poser 1 min, rincer.",
    hasVariants: true,
    reorderPoint: 5,
    initialStock: 18,
    variants: [
      { sku: "KLO-QUI-200", name: "200ml", priceTnd: "32.500", isDefault: true },
      { sku: "KLO-QUI-400", name: "400ml", priceTnd: "55.900" },
    ],
    imageUrl: `${PARASHOP}/klorane/klorane-shampooing-fortifiant-quinine-400ml-550x550.jpg`,
    imageAlt: "Flacon Klorane Shampooing Quinine",
  },

  // 23. Klorane Shampooing sec lait d'avoine
  {
    id: "70000000-0000-4000-8000-000000000142",
    slug: "klorane-shampooing-sec-avoine",
    name: "Klorane Shampooing Sec au Lait d'Avoine 150ml",
    brandSlug: "klorane",
    categorySlug: cosCheveux,
    shortDescription:
      "Shampooing sec apaisant — cheveux frais en quelques secondes.",
    description:
      "Absorbe l'excès de sébum et redonne légèreté aux cheveux entre deux shampooings. Au lait d'avoine bio, doux pour le cuir chevelu sensible. Disponible classique ou teinté.",
    ingredients: "Lait d'avoine bio, amidon de riz, propellant.",
    usage:
      "Vaporiser à 20 cm sur les racines, masser, brosser pour éliminer le résidu.",
    hasVariants: false,
    sku: "KLO-SS-AV-150",
    priceTnd: "39.500",
    reorderPoint: 6,
    initialStock: 20,
    imageUrl: `${PARASHOP}/klorane/klorane-shampooing-sec-au-lait-d-avoine-150ml-550x550.jpg`,
    imageAlt: "Aérosol Klorane Shampooing Sec",
  },

  // 24. Ducray Anaphase+ shampooing complément antichute
  {
    id: "70000000-0000-4000-8000-000000000143",
    slug: "ducray-anaphase-shampooing-antichute",
    name: "Ducray Anaphase+ Shampooing Crème Antichute 200ml",
    brandSlug: "ducray",
    categorySlug: cosCheveux,
    shortDescription:
      "Shampooing complément des traitements antichute.",
    description:
      "Stimule et redensifie le cheveu, prépare le cuir chevelu aux soins antichute. Texture crème onctueuse aux vitamines B et acides aminés.",
    ingredients:
      "Vitamines B5/B6/B8, complexe Vinactif®, acides aminés.",
    usage:
      "Appliquer sur cheveux mouillés, masser, laisser poser 2 minutes, rincer. 3 fois par semaine.",
    hasVariants: false,
    sku: "DUC-ANA-200",
    priceTnd: "49.500",
    reorderPoint: 5,
    initialStock: 16,
    imageUrl: `${PARASHOP}/ducray/ducray-anaphase-shampooing-antichute-200ml-550x550.jpg`,
    imageAlt: "Flacon Ducray Anaphase+ Shampooing",
  },

  // 25. Phyto Phytocyane Shampooing Revigorant
  {
    id: "70000000-0000-4000-8000-000000000144",
    slug: "phyto-phytocyane-shampooing",
    name: "Phyto Phytocyane Shampooing Revigorant 250ml",
    brandSlug: "phyto",
    categorySlug: cosCheveux,
    shortDescription:
      "Shampooing complément des soins antichute femme.",
    description:
      "Idéal pour préparer le cuir chevelu avant un traitement antichute. Au ginkgo biloba et provitamines B5/B6, redonne vitalité au cheveu. Sans silicone ni colorant.",
    ingredients:
      "Extrait de ginkgo biloba, provitamines B5/B6, romarin bio.",
    usage:
      "Sur cheveux mouillés, faire mousser, masser le cuir chevelu, laisser poser 2 min, rincer.",
    hasVariants: false,
    sku: "PHY-CYA-250",
    priceTnd: "62.500",
    reorderPoint: 4,
    initialStock: 12,
    imageUrl: `${PARASHOP}/phyto/phyto-phytocyane-shampooing-revigorant-250ml-550x550.jpg`,
    imageAlt: "Flacon Phyto Phytocyane Shampooing",
  },

  // ============================================================
  // ORTHOPÉDIE (8)
  // ============================================================

  // 26. Thuasne Genouillère ligamentaire Genupro Control
  {
    id: "70000000-0000-4000-8000-000000000200",
    slug: "thuasne-genouillere-ligamentaire-genupro",
    name: "Thuasne Genouillère Ligamentaire GenuPro Control",
    brandSlug: "thuasne",
    categorySlug: "genou",
    shortDescription:
      "Genouillère articulée à renforts latéraux pour entorses du genou.",
    description:
      "Maintient le genou en cas d'instabilité ligamentaire. Articulations latérales polycentriques, sangles de serrage croisées, tissu respirant.",
    usage:
      "Porter en journée pendant la phase de rééducation. Adapter le serrage selon le confort.",
    hasVariants: true,
    reorderPoint: 3,
    initialStock: 10,
    variants: [
      { sku: "THU-GP-S", name: "Taille S", priceTnd: "189.000" },
      { sku: "THU-GP-M", name: "Taille M", priceTnd: "189.000", isDefault: true },
      { sku: "THU-GP-L", name: "Taille L", priceTnd: "189.000" },
      { sku: "THU-GP-XL", name: "Taille XL", priceTnd: "199.000" },
    ],
    imageAlt: "Genouillère Thuasne GenuPro Control",
  },

  // 27. Thuasne Genouillère rotulienne Silistab Genu
  {
    id: "70000000-0000-4000-8000-000000000201",
    slug: "thuasne-silistab-genu-rotulienne",
    name: "Thuasne Silistab Genu Genouillère Rotulienne",
    brandSlug: "thuasne",
    categorySlug: "genou",
    shortDescription:
      "Genouillère élastique avec anneau rotulien en silicone.",
    description:
      "Soulage les douleurs rotuliennes et chondromalacies. Anneau silicone qui maintient la rotule. Tricot respirant, idéale pour la pratique sportive.",
    usage: "Enfiler comme une chaussette, l'anneau silicone autour de la rotule.",
    hasVariants: true,
    reorderPoint: 3,
    initialStock: 12,
    variants: [
      { sku: "THU-SG-S", name: "Taille S", priceTnd: "115.000" },
      { sku: "THU-SG-M", name: "Taille M", priceTnd: "115.000", isDefault: true },
      { sku: "THU-SG-L", name: "Taille L", priceTnd: "115.000" },
      { sku: "THU-SG-XL", name: "Taille XL", priceTnd: "119.000" },
    ],
    imageAlt: "Genouillère Thuasne Silistab Genu",
  },

  // 28. Thuasne Lombatech ceinture lombaire
  {
    id: "70000000-0000-4000-8000-000000000202",
    slug: "thuasne-lombatech-ceinture",
    name: "Thuasne Lombatech Ceinture de Soutien Lombaire",
    brandSlug: "thuasne",
    categorySlug: "lombaire",
    shortDescription:
      "Ceinture lombaire double sangle, soulagement des lombalgies.",
    description:
      "Système double sangle pour ajuster le serrage. Baleines postérieures pour soulager le rachis lombaire. Hauteur 26 cm, tissu respirant.",
    usage:
      "Porter en journée selon prescription. Retirer la nuit. Ne pas serrer excessivement.",
    hasVariants: true,
    reorderPoint: 3,
    initialStock: 12,
    variants: [
      { sku: "THU-LT-S", name: "Taille S", priceTnd: "165.000" },
      { sku: "THU-LT-M", name: "Taille M", priceTnd: "165.000", isDefault: true },
      { sku: "THU-LT-L", name: "Taille L", priceTnd: "165.000" },
      { sku: "THU-LT-XL", name: "Taille XL", priceTnd: "175.000" },
    ],
    imageAlt: "Ceinture lombaire Thuasne Lombatech",
  },

  // 29. Thuasne Lombaskin discrète
  {
    id: "70000000-0000-4000-8000-000000000203",
    slug: "thuasne-lombaskin-26",
    name: "Thuasne LombaSkin 26 cm Ceinture Discrète",
    brandSlug: "thuasne",
    categorySlug: "lombaire",
    shortDescription:
      "Ceinture lombaire fine, à porter à même la peau, invisible sous les vêtements.",
    description:
      "Tissu fin sans baleines, technologie élastique progressive. Idéale pour un usage discret toute la journée. Hauteur 26 cm.",
    usage: "Porter à même la peau ou par-dessus un sous-vêtement.",
    hasVariants: true,
    reorderPoint: 3,
    initialStock: 10,
    variants: [
      { sku: "THU-LS-S", name: "Taille S", priceTnd: "129.000" },
      { sku: "THU-LS-M", name: "Taille M", priceTnd: "129.000", isDefault: true },
      { sku: "THU-LS-L", name: "Taille L", priceTnd: "129.000" },
      { sku: "THU-LS-XL", name: "Taille XL", priceTnd: "139.000" },
    ],
    imageAlt: "Ceinture lombaire Thuasne LombaSkin",
  },

  // 30. Epitact Chevillère ergonomique
  {
    id: "70000000-0000-4000-8000-000000000204",
    slug: "epitact-chevillere-ergonomique",
    name: "Epitact Chevillère Ergonomique de Maintien",
    brandSlug: "epitact",
    categorySlug: "cheville",
    shortDescription:
      "Chevillère anatomique pour œdème et arthrose de la cheville.",
    description:
      "Tricot ergonomique épousant l'anatomie. Soulage les douleurs articulaires et favorise la résorption des œdèmes. Confortable au quotidien.",
    usage: "Enfiler le matin, porter toute la journée.",
    hasVariants: true,
    reorderPoint: 3,
    initialStock: 10,
    variants: [
      { sku: "EPI-CHE-S", name: "Taille S", priceTnd: "95.000" },
      { sku: "EPI-CHE-M", name: "Taille M", priceTnd: "95.000", isDefault: true },
      { sku: "EPI-CHE-L", name: "Taille L", priceTnd: "95.000" },
    ],
    imageAlt: "Chevillère Epitact Ergonomique",
  },

  // 31. Epitact Ergostrap Sport entorse
  {
    id: "70000000-0000-4000-8000-000000000205",
    slug: "epitact-ergostrap-sport",
    name: "Epitact ERGOstrap Sport Chevillère Ligamentaire",
    brandSlug: "epitact",
    categorySlug: "cheville",
    shortDescription:
      "Chevillère renforcée pour entorse et reprise sportive.",
    description:
      "Sanglage en 8 reproduisant l'effet d'un strap. Stabilise la cheville lors de la reprise du sport après entorse. Discrète sous la chaussure.",
    usage:
      "Mettre avant l'effort, ajuster les sangles selon la stabilité recherchée.",
    hasVariants: true,
    reorderPoint: 3,
    initialStock: 8,
    variants: [
      { sku: "EPI-ERG-S", name: "Taille S", priceTnd: "139.000" },
      { sku: "EPI-ERG-M", name: "Taille M", priceTnd: "139.000", isDefault: true },
      { sku: "EPI-ERG-L", name: "Taille L", priceTnd: "139.000" },
    ],
    imageAlt: "Chevillère Epitact ERGOstrap Sport",
  },

  // 32. Herbi Feet Semelles gel
  {
    id: "70000000-0000-4000-8000-000000000206",
    slug: "herbi-feet-semelles-gel",
    name: "Herbi Feet Semelles Confort Gel",
    brandSlug: "herbi-feet",
    categorySlug: "aides-marche",
    shortDescription:
      "Semelles en silicone amortissantes pour confort de marche.",
    description:
      "Réduisent la pression plantaire et amortissent les chocs. Zones d'amorti renforcées au talon et à l'avant-pied. Silicone souple, lavables.",
    usage:
      "Insérer dans la chaussure. Découper si nécessaire selon la pointure.",
    hasVariants: true,
    reorderPoint: 5,
    initialStock: 18,
    variants: [
      { sku: "HF-SG-36-39", name: "Pointure 36-39", priceTnd: "29.500" },
      { sku: "HF-SG-40-43", name: "Pointure 40-43", priceTnd: "29.500", isDefault: true },
      { sku: "HF-SG-44-46", name: "Pointure 44-46", priceTnd: "32.500" },
    ],
    imageAlt: "Semelles gel Herbi Feet",
  },

  // 33. Thuasne Bracelet anti-épicondylite (coude)
  {
    id: "70000000-0000-4000-8000-000000000207",
    slug: "thuasne-epicondylite-coude",
    name: "Thuasne Bracelet Anti-Épicondylite Sport",
    brandSlug: "thuasne",
    categorySlug: "aides-marche",
    shortDescription:
      "Bracelet de compression pour tendinite du coude (tennis elbow).",
    description:
      "Coussinet de pression localisée sur l'avant-bras. Soulage la tension musculaire au point d'insertion tendineuse. Sangle réglable.",
    usage:
      "Positionner le coussinet sur la zone douloureuse, ajuster le serrage.",
    hasVariants: false,
    sku: "THU-EPI",
    priceTnd: "59.500",
    reorderPoint: 3,
    initialStock: 8,
    imageAlt: "Bracelet anti-épicondylite Thuasne",
  },

  // ============================================================
  // MATÉRIEL MÉDICAL (12)
  // ============================================================

  // 34. Omron M3 Comfort
  {
    id: "70000000-0000-4000-8000-000000000300",
    slug: "omron-m3-comfort-tensiometre",
    name: "Omron M3 Comfort Tensiomètre Bras Automatique",
    brandSlug: "omron",
    categorySlug: "tension",
    shortDescription:
      "Tensiomètre brassard automatique avec brassard préformé Intelli Wrap.",
    description:
      "Brassard Intelli Wrap pour mesure précise quel que soit le positionnement. Détection des battements cardiaques irréguliers. Mémoire 60 mesures pour 2 utilisateurs.",
    usage:
      "Position assise, brassard sur bras nu, déclencher la mesure et rester immobile.",
    hasVariants: false,
    sku: "OMR-M3C",
    priceTnd: "229.000",
    reorderPoint: 2,
    initialStock: 6,
    imageUrl: "https://www.omron-healthcare.com/eu/m3-comfort.html",
    imageAlt: "Tensiomètre Omron M3 Comfort",
  },

  // 35. Omron M6 Comfort
  {
    id: "70000000-0000-4000-8000-000000000301",
    slug: "omron-m6-comfort-tensiometre",
    name: "Omron M6 Comfort Tensiomètre Bras",
    brandSlug: "omron",
    categorySlug: "tension",
    shortDescription:
      "Tensiomètre haut de gamme avec brassard Intelli Wrap, mémoire 100 mesures.",
    description:
      "Détection AFib (fibrillation auriculaire). Brassard préformé adulte/obèse 22-42 cm. Mémoire 100 mesures par utilisateur (2 utilisateurs).",
    hasVariants: false,
    sku: "OMR-M6C",
    priceTnd: "299.000",
    reorderPoint: 2,
    initialStock: 5,
    imageAlt: "Tensiomètre Omron M6 Comfort",
  },

  // 36. Omron M7 Intelli IT
  {
    id: "70000000-0000-4000-8000-000000000302",
    slug: "omron-m7-intelli-it",
    name: "Omron M7 Intelli IT Tensiomètre Connecté",
    brandSlug: "omron",
    categorySlug: "tension",
    shortDescription:
      "Tensiomètre Bluetooth avec détection AFib, application Omron Connect.",
    description:
      "Premier tensiomètre Omron clinquement validé avec détection AFib. Synchronise les données avec smartphone via Bluetooth. Brassard Intelli Wrap.",
    hasVariants: false,
    sku: "OMR-M7-IT",
    priceTnd: "395.000",
    reorderPoint: 2,
    initialStock: 4,
    imageAlt: "Tensiomètre Omron M7 Intelli IT",
  },

  // 37. Accu-Chek Performa lecteur
  {
    id: "70000000-0000-4000-8000-000000000303",
    slug: "accu-chek-performa-lecteur",
    name: "Accu-Chek Performa Lecteur de Glycémie",
    brandSlug: "accu-chek",
    categorySlug: "diabete",
    shortDescription:
      "Lecteur de glycémie avec port USB et 500 résultats en mémoire.",
    description:
      "Mesure rapide en 5 secondes. Plage de mesure 10-600 mg/dl. Calcul automatique des moyennes 7/14/30 jours. Marquage des événements (avant/après repas).",
    usage:
      "Insérer une bandelette, déposer une goutte de sang capillaire, lire le résultat.",
    hasVariants: false,
    sku: "ACK-PERF-LCT",
    priceTnd: "139.000",
    reorderPoint: 3,
    initialStock: 8,
    imageAlt: "Lecteur Accu-Chek Performa",
  },

  // 38. Accu-Chek Performa bandelettes
  {
    id: "70000000-0000-4000-8000-000000000304",
    slug: "accu-chek-performa-bandelettes",
    name: "Accu-Chek Performa Bandelettes Réactives",
    brandSlug: "accu-chek",
    categorySlug: "diabete",
    shortDescription:
      "Bandelettes pour lecteur Accu-Chek Performa.",
    description:
      "Bandelettes réactives à technologie Smart View. Compatibles uniquement avec le lecteur Accu-Chek Performa. À conserver dans leur boîte hermétique.",
    usage:
      "Insérer la bandelette dans le lecteur, déposer la goutte de sang sur la zone réactive.",
    hasVariants: true,
    reorderPoint: 6,
    initialStock: 36,
    variants: [
      { sku: "ACK-BD-PERF-25", name: "Boîte de 25", priceTnd: "32.900" },
      { sku: "ACK-BD-PERF-50", name: "Boîte de 50", priceTnd: "59.000", isDefault: true },
      { sku: "ACK-BD-PERF-100", name: "Boîte de 100", priceTnd: "109.000" },
    ],
    imageAlt: "Bandelettes Accu-Chek Performa",
  },

  // 39. Accu-Chek Softclix lancettes
  {
    id: "70000000-0000-4000-8000-000000000305",
    slug: "accu-chek-softclix-lancettes",
    name: "Accu-Chek Softclix Lancettes Boîte de 200",
    brandSlug: "accu-chek",
    categorySlug: "diabete",
    shortDescription:
      "Lancettes stériles pour autopiqueur Accu-Chek Softclix.",
    description:
      "Lancettes à usage unique. Aiguille fine pour limiter la sensation de piqûre. Compatibles autopiqueurs Accu-Chek Softclix.",
    hasVariants: false,
    sku: "ACK-SC-200",
    priceTnd: "29.500",
    reorderPoint: 6,
    initialStock: 24,
    imageAlt: "Lancettes Accu-Chek Softclix",
  },

  // 40. Beurer PO 30 oxymètre
  {
    id: "70000000-0000-4000-8000-000000000306",
    slug: "beurer-po30-oxymetre",
    name: "Beurer PO 30 Oxymètre de Pouls",
    brandSlug: "beurer",
    categorySlug: "premiers-soins",
    shortDescription:
      "Oxymètre digital — saturation SpO2 et pouls en quelques secondes.",
    description:
      "Mesure la saturation artérielle en oxygène et le rythme cardiaque. Affichage couleur, indicateur graphique du pouls. Auto-extinction. Idéal sportifs et personnes âgées.",
    usage:
      "Glisser le doigt dans le capteur, attendre la lecture (5-10 secondes).",
    hasVariants: false,
    sku: "BEU-PO30",
    priceTnd: "139.000",
    reorderPoint: 3,
    initialStock: 8,
    imageUrl: `${PARASHOP}/beurer/beurer-po-30-oxymetre-de-pouls-550x550.jpg`,
    imageAlt: "Oxymètre Beurer PO 30",
  },

  // 41. Microlife NC 200 thermomètre infrarouge
  {
    id: "70000000-0000-4000-8000-000000000307",
    slug: "microlife-nc200-thermometre",
    name: "Microlife NC 200 Thermomètre Infrarouge Sans Contact",
    brandSlug: "microlife",
    categorySlug: "premiers-soins",
    shortDescription:
      "Thermomètre frontal sans contact à technologie auto-mesure.",
    description:
      "Mesure en 2 secondes à distance de 1-5 cm. Triple système de validation. Mémorise 30 mesures. Idéal famille avec enfants en bas âge.",
    usage:
      "Pointer le capteur au centre du front à 1-5 cm, déclencher la mesure.",
    hasVariants: false,
    sku: "MIC-NC200",
    priceTnd: "159.000",
    reorderPoint: 2,
    initialStock: 6,
    imageAlt: "Thermomètre Microlife NC 200",
  },

  // 42. Omron NE-C101 aérosol pneumatique
  {
    id: "70000000-0000-4000-8000-000000000308",
    slug: "omron-c101-aerosol",
    name: "Omron CompAir NE-C101 Nébuliseur Pneumatique",
    brandSlug: "omron",
    categorySlug: "aerosol",
    shortDescription:
      "Nébuliseur pneumatique compact pour traitements respiratoires.",
    description:
      "Technologie Virtual Valve Technology pour une nébulisation efficace. Compresseur silencieux. Convient adulte et enfant. Masques et embout buccal inclus.",
    usage:
      "Verser le médicament prescrit, choisir le masque adapté, allumer le compresseur.",
    hasVariants: false,
    sku: "OMR-C101",
    priceTnd: "189.000",
    reorderPoint: 2,
    initialStock: 5,
    imageAlt: "Nébuliseur Omron CompAir NE-C101",
  },

  // 43. Masques chirurgicaux 3 plis
  {
    id: "70000000-0000-4000-8000-000000000309",
    slug: "masques-chirurgicaux-type-iir",
    name: "Masques Chirurgicaux 3 Plis Type IIR Boîte de 50",
    brandSlug: "omron", // generic — falls back to Omron as parent brand placeholder
    categorySlug: "protection-respiratoire",
    shortDescription:
      "Masques chirurgicaux jetables Type IIR, filtration ≥98%.",
    description:
      "Masques chirurgicaux 3 plis à élastiques, conforme à la norme EN14683 Type IIR. Barrette nasale ajustable, port confortable jusqu'à 4 heures.",
    usage:
      "Mettre le masque par les élastiques, ajuster la barrette nasale, ne pas réutiliser.",
    hasVariants: false,
    sku: "MASK-IIR-50",
    priceTnd: "12.500",
    reorderPoint: 10,
    initialStock: 60,
    imageAlt: "Boîte de 50 masques chirurgicaux Type IIR",
  },

  // 44. Gants nitrile boîte de 100
  {
    id: "70000000-0000-4000-8000-00000000030a",
    slug: "gants-nitrile-non-poudres",
    name: "Gants d'Examen Nitrile Non Poudrés Boîte de 100",
    brandSlug: "omron", // generic placeholder
    categorySlug: "protection-respiratoire",
    shortDescription:
      "Gants jetables en nitrile, sans latex, sans poudre.",
    description:
      "Gants ambidextres pour examen médical et soins. Nitrile bleu, sans latex (hypoallergéniques) et sans poudre. Conformes EN 455.",
    hasVariants: true,
    reorderPoint: 6,
    initialStock: 30,
    variants: [
      { sku: "GANT-NIT-S", name: "Taille S", priceTnd: "22.500" },
      { sku: "GANT-NIT-M", name: "Taille M", priceTnd: "22.500", isDefault: true },
      { sku: "GANT-NIT-L", name: "Taille L", priceTnd: "22.500" },
      { sku: "GANT-NIT-XL", name: "Taille XL", priceTnd: "24.500" },
    ],
    imageAlt: "Boîte de gants nitrile",
  },

  // 45. Canne quadripode
  {
    id: "70000000-0000-4000-8000-00000000030b",
    slug: "canne-quadripode",
    name: "Canne Quadripode Aluminium Réglable",
    brandSlug: "thuasne",
    categorySlug: "aides-marche",
    shortDescription:
      "Canne 4 points pour stabilité maximale.",
    description:
      "Base à 4 pieds antidérapants pour stabilité accrue. Aluminium léger, hauteur réglable de 73 à 95 cm. Charge maximale 100 kg.",
    usage: "Régler la hauteur au niveau du poignet, bras tendu le long du corps.",
    hasVariants: false,
    sku: "ORT-CAN-Q4",
    priceTnd: "89.000",
    reorderPoint: 2,
    initialStock: 6,
    imageAlt: "Canne quadripode aluminium",
  },

  // ============================================================
  // PARAPHARMACIE GÉNÉRALE (5)
  // ============================================================

  // 46. Forté Pharma Multivit 4G
  {
    id: "70000000-0000-4000-8000-000000000400",
    slug: "forte-pharma-multivit-4g",
    name: "Forté Pharma Énergie Multivit 4G 60 comprimés",
    brandSlug: "forte-pharma",
    categorySlug: "complements",
    shortDescription:
      "12 vitamines, 7 minéraux et 4 plantes pour la vitalité.",
    description:
      "Cure de fond pour combler les carences et lutter contre la fatigue. Complexe 4G : ginseng, guarana, gelée royale et gingembre.",
    ingredients:
      "Vitamines A, B, C, D3, E ; magnésium, zinc, fer ; ginseng, guarana, gelée royale, gingembre.",
    usage:
      "1 à 2 comprimés par jour avec un grand verre d'eau, le matin pendant le repas.",
    hasVariants: false,
    sku: "FP-MV4-60",
    priceTnd: "55.900",
    reorderPoint: 5,
    initialStock: 18,
    imageUrl: `${PARASHOP}/fortepharma/forte-pharma-energie-multivit-4g-60-comprimes-550x550.jpg`,
    imageAlt: "Boîte Forté Pharma Multivit 4G",
  },

  // 47. Forté Pharma Vitalité 4G Ultra Boost
  {
    id: "70000000-0000-4000-8000-000000000401",
    slug: "forte-pharma-vitalite-4g-ultra-boost",
    name: "Forté Pharma Vitalité 4G Ultra Boost 30 comprimés",
    brandSlug: "forte-pharma",
    categorySlug: "complements",
    shortDescription:
      "Stimulant physique et mental rapide à base de ginseng et guarana.",
    description:
      "Pour les coups de pompe et les périodes intenses. Action rapide grâce au complexe ginseng + guarana hautement dosé. Cure d'1 mois.",
    ingredients:
      "Ginseng, guarana, vitamines B, vitamine C, magnésium.",
    usage: "1 comprimé par jour le matin pendant 30 jours.",
    hasVariants: false,
    sku: "FP-VUB-30",
    priceTnd: "70.900",
    reorderPoint: 5,
    initialStock: 16,
    imageUrl: `${PARASHOP}/fortepharma/forte-pharma-ultra-boost-4g-30-comprimes-550x550.jpg`,
    imageAlt: "Boîte Forté Pharma Vitalité 4G Ultra Boost",
  },

  // 48. FortiMag Magnésium
  {
    id: "70000000-0000-4000-8000-000000000402",
    slug: "fortimag-magnesium",
    name: "FortiMag Magnésium Bisglycinate 30 gélules",
    brandSlug: "forte-pharma",
    categorySlug: "complements",
    shortDescription:
      "Magnésium hautement assimilable pour fatigue et stress.",
    description:
      "Bisglycinate de magnésium associé à la vitamine B6 pour réduire la fatigue physique et mentale. Sans effet laxatif.",
    ingredients:
      "Bisglycinate de magnésium 300 mg, vitamine B6.",
    usage: "1 gélule par jour avec un verre d'eau.",
    hasVariants: false,
    sku: "FORTIMAG-30",
    priceTnd: "39.500",
    reorderPoint: 5,
    initialStock: 18,
    imageUrl: `${PARASHOP}/fortepharma/fortimag-magnesium-30-gellules-550x550.jpg`,
    imageAlt: "Boîte FortiMag Magnésium",
  },

  // 49. Saforelle Soin Lavant Doux
  {
    id: "70000000-0000-4000-8000-000000000403",
    slug: "saforelle-soin-lavant-doux",
    name: "Saforelle Soin Lavant Doux Apaisant",
    brandSlug: "saforelle",
    categorySlug: "hygiene-intime",
    shortDescription:
      "Soin lavant intime et corporel pour peaux sensibles et irritées.",
    description:
      "À l'extrait de Bardane reconnu pour ses propriétés apaisantes. Sans savon, sans paraben, sans colorant. pH alcalin (8) adapté aux périodes d'inconfort.",
    ingredients:
      "Extrait de Bardane, base lavante douce, sans savon.",
    usage:
      "Appliquer pur ou dilué sur la zone à laver. Rincer abondamment. Usage quotidien.",
    hasVariants: true,
    reorderPoint: 6,
    initialStock: 22,
    variants: [
      { sku: "SAF-DOUX-100", name: "100ml", priceTnd: "13.500" },
      { sku: "SAF-DOUX-250", name: "250ml", priceTnd: "26.500", isDefault: true },
      { sku: "SAF-DOUX-500", name: "500ml", priceTnd: "45.500" },
    ],
    imageUrl: `${PARASHOP}/saforelle/saforelle-soin-lavant-doux-apaisant-100ml-550x550.jpg`,
    imageAlt: "Flacon Saforelle Soin Lavant Doux",
  },

  // 50. Mustela Stelatopia Crème Émolliente
  {
    id: "70000000-0000-4000-8000-000000000404",
    slug: "mustela-stelatopia-creme-emolliente",
    name: "Mustela Stelatopia Crème Émolliente 200ml",
    brandSlug: "mustela",
    categorySlug: "bebe",
    shortDescription:
      "Crème émolliente bébé pour peaux à tendance atopique.",
    description:
      "Hydrate intensément, restaure la barrière cutanée et apaise les démangeaisons. À 96% d'origine naturelle. Testée sous contrôle pédiatrique dès la naissance.",
    ingredients:
      "Avocat Perseose breveté, beurre de karité, huile de tournesol distillée.",
    usage:
      "Appliquer 1 à 2 fois par jour sur l'ensemble du corps en massant délicatement.",
    hasVariants: false,
    sku: "MUS-STA-200",
    priceTnd: "55.900",
    reorderPoint: 5,
    initialStock: 16,
    imageUrl: `${PARASHOP}/mustela/mustela-stelatopia-creme-emolliente-200ml-550x550.jpg`,
    imageAlt: "Tube Mustela Stelatopia Crème Émolliente",
  },
];
