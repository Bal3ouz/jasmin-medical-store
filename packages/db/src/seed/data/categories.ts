export const CATEGORY_SEED = [
  { id: "c0000000-0000-4000-8000-000000000001", slug: "cosmetique", name: "Cosmétique", description: "Soins du visage, du corps et des cheveux.", parentId: null, displayOrder: 1 },
  { id: "c0000000-0000-4000-8000-000000000002", slug: "orthopedie", name: "Orthopédie", description: "Maintien, soutien et confort articulaire.", parentId: null, displayOrder: 2 },
  { id: "c0000000-0000-4000-8000-000000000003", slug: "materiel-medical", name: "Matériel médical", description: "Tension, diabète, aérosols, mobilité.", parentId: null, displayOrder: 3 },
  { id: "c0000000-0000-4000-8000-000000000004", slug: "parapharmacie", name: "Parapharmacie générale", description: "Hygiène, premiers soins, compléments.", parentId: null, displayOrder: 4 },

  { id: "c0000000-0000-4000-8000-000000000011", slug: "visage", name: "Visage", parentId: "c0000000-0000-4000-8000-000000000001", description: "Soins du visage.", displayOrder: 1 },
  { id: "c0000000-0000-4000-8000-000000000012", slug: "corps", name: "Corps", parentId: "c0000000-0000-4000-8000-000000000001", description: "Soins du corps.", displayOrder: 2 },
  { id: "c0000000-0000-4000-8000-000000000013", slug: "cheveux", name: "Cheveux", parentId: "c0000000-0000-4000-8000-000000000001", description: "Soins capillaires.", displayOrder: 3 },
  { id: "c0000000-0000-4000-8000-000000000014", slug: "solaire", name: "Solaire", parentId: "c0000000-0000-4000-8000-000000000001", description: "Protection solaire.", displayOrder: 4 },

  { id: "c0000000-0000-4000-8000-000000000021", slug: "lombaire", name: "Soutien lombaire", parentId: "c0000000-0000-4000-8000-000000000002", description: "Ceintures et orthèses lombaires.", displayOrder: 1 },
  { id: "c0000000-0000-4000-8000-000000000022", slug: "genou", name: "Genou", parentId: "c0000000-0000-4000-8000-000000000002", description: "Genouillères et orthèses.", displayOrder: 2 },
  { id: "c0000000-0000-4000-8000-000000000023", slug: "cheville", name: "Cheville", parentId: "c0000000-0000-4000-8000-000000000002", description: "Chevillères.", displayOrder: 3 },
  { id: "c0000000-0000-4000-8000-000000000024", slug: "aides-marche", name: "Aides à la marche", parentId: "c0000000-0000-4000-8000-000000000002", description: "Cannes, béquilles, déambulateurs.", displayOrder: 4 },

  { id: "c0000000-0000-4000-8000-000000000031", slug: "tension", name: "Tension artérielle", parentId: "c0000000-0000-4000-8000-000000000003", description: "Tensiomètres et accessoires.", displayOrder: 1 },
  { id: "c0000000-0000-4000-8000-000000000032", slug: "diabete", name: "Diabète", parentId: "c0000000-0000-4000-8000-000000000003", description: "Lecteurs et bandelettes.", displayOrder: 2 },
  { id: "c0000000-0000-4000-8000-000000000033", slug: "aerosol", name: "Aérosolthérapie", parentId: "c0000000-0000-4000-8000-000000000003", description: "Aérosols et nébuliseurs.", displayOrder: 3 },
  { id: "c0000000-0000-4000-8000-000000000034", slug: "fauteuils", name: "Fauteuils roulants", parentId: "c0000000-0000-4000-8000-000000000003", description: "Mobilité et autonomie.", displayOrder: 4 },

  { id: "c0000000-0000-4000-8000-000000000041", slug: "bebe", name: "Bébé", parentId: "c0000000-0000-4000-8000-000000000004", description: "Soins bébé et puériculture.", displayOrder: 1 },
  { id: "c0000000-0000-4000-8000-000000000042", slug: "premiers-soins", name: "Premiers soins", parentId: "c0000000-0000-4000-8000-000000000004", description: "Pansements, antiseptiques.", displayOrder: 2 },
  { id: "c0000000-0000-4000-8000-000000000043", slug: "complements", name: "Compléments alimentaires", parentId: "c0000000-0000-4000-8000-000000000004", description: "Vitamines, énergie, sommeil.", displayOrder: 3 },
];
