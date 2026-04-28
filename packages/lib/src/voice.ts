export const VOICE = {
  emptyCart: "Votre panier est calme pour l'instant.",
  emptyWishlist: "Aucun coup de cœur enregistré.",
  outOfStock: "Bientôt de retour",
  lowStock: "Plus que quelques pièces",
  addToCartCta: "Ajouter au panier",
  buyNowCta: "Acheter",
  newsletterPitch: "Recevez nos sélections en avant-première et nos rituels saisonniers.",
  newsletterCta: "Je m'inscris",
  heroTagline: "Prenez soin de vous, avec douceur.",
  heroSubtitle: "Parapharmacie & matériel médical, sélectionné avec amour à Nabeul.",
  trustedBrandsLabel: "Marques de confiance",
  contactBaseline: "Une question ? Notre équipe est joignable du lundi au samedi.",
} as const;

export type VoiceKey = keyof typeof VOICE;
