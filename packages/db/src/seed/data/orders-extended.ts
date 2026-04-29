/**
 * Extended demo order seed for Jasmin Médical Store.
 *
 * 50 orders distributed over the last 90 days with a "lived-in" feel:
 *   - More orders in the last 30 days, fewer further back.
 *   - Mid-week clustering and a few "flurry" days (multiple orders close together).
 *   - Status mix: 20 delivered, 5 shipped, 5 preparing, 5 confirmed, 5 pending,
 *                 5 cancelled, 5 refunded.
 *   - Origin mix: ~30 customer web orders, ~11 guest web orders, 10 walk-ins.
 *
 * The integrator script is responsible for:
 *   - Resolving `productSlug` → product_id and `variantSku` → variant_id.
 *   - Filling `product_name_snapshot`, `variant_name_snapshot`, `brand_snapshot`,
 *     `sku_snapshot` from the live product / variant / brand rows at seed time.
 *   - Computing `subtotal_tnd`, `shipping_tnd`, `total_tnd` from line items
 *     (shipping_tnd = 7.000 for non-walk-in, 0 for walk-in).
 *   - Materialising the timestamp cascade from `daysAgo` + `hourOfDay`:
 *       confirmed_at = created_at + ~1h         (status >= confirmed)
 *       shipped_at   = confirmed_at + 1-2 days  (status >= shipped)
 *       delivered_at = shipped_at  + 1-3 days   (status === delivered)
 *       cancelled_at = created_at + ~1h         (status === cancelled / refunded)
 *   - Inserting order_events from the resulting status timeline.
 *
 * Order numbers below start at JMS-2026-000100 to leave room above the existing
 * seed (which uses 000001..000020). The integrator may override via nextval.
 */

export interface ExtendedSeedOrderItem {
  productSlug: string;
  /** Required when the parent product `hasVariants === true`. */
  variantSku?: string;
  quantity: number;
}

export type ExtendedOrderOrigin = "web_customer" | "web_guest" | "walk_in";

export type ExtendedOrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface ExtendedSeedOrder {
  /** Hint for the integrator; can be overridden via nextval('jms_order_seq'). */
  orderNumber: string;
  origin: ExtendedOrderOrigin;
  /** When `origin === "web_customer"` (or walk-in linked), the customer email. */
  customerEmail?: string;
  /** When `origin === "web_guest"` (or unlinked walk-in), the guest contact. */
  guestEmail?: string;
  guestPhone?: string;

  shipping: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    postalCode: string;
    governorate: string;
    country: string;
  };

  items: ExtendedSeedOrderItem[];

  paymentMethod: "cash_on_delivery";
  status: ExtendedOrderStatus;

  /** Days before "now" the order was created (0 = today). */
  daysAgo: number;
  /** Hour of day (0–23) — used to spread orders within a day for the cascade. */
  hourOfDay: number;

  notesCustomer: string | null;
  notesInternal: string | null;
}

// ---------------------------------------------------------------------------
// Shared shipping snapshots
// ---------------------------------------------------------------------------

// Snapshots copied verbatim from EXTENDED_ADDRESS_SEED so the integrator does
// not need to re-resolve them. Kept in sync manually.
const ADDR = {
  mehdi: {
    fullName: "Mehdi Bouzguenda",
    phone: "+216 22 412 087",
    street: "27 Avenue Habib Bourguiba",
    city: "Nabeul",
    postalCode: "8000",
    governorate: "Nabeul",
    country: "TN",
  },
  amina: {
    fullName: "Amina Sassi",
    phone: "+216 25 778 340",
    street: "14 Rue Ibn Khaldoun",
    city: "Nabeul",
    postalCode: "8000",
    governorate: "Nabeul",
    country: "TN",
  },
  hassen: {
    fullName: "Hassen Oueslati",
    phone: "+216 98 134 552",
    street: "9 Cité El Arbaa",
    city: "Hammamet",
    postalCode: "8050",
    governorate: "Nabeul",
    country: "TN",
  },
  rim: {
    fullName: "Rim Jebali",
    phone: "+216 27 904 116",
    street: "31 Avenue de la République",
    city: "Hammamet",
    postalCode: "8050",
    governorate: "Nabeul",
    country: "TN",
  },
  walid: {
    fullName: "Walid Bouaziz",
    phone: "+216 50 332 770",
    street: "6 Rue de la Plage",
    city: "Kelibia",
    postalCode: "8090",
    governorate: "Nabeul",
    country: "TN",
  },
  sonia: {
    fullName: "Sonia Mejri",
    phone: "+216 96 217 044",
    street: "18 Rue Hedi Chaker",
    city: "Korba",
    postalCode: "8070",
    governorate: "Nabeul",
    country: "TN",
  },
  nizar: {
    fullName: "Nizar Hammami",
    phone: "+216 21 658 932",
    street: "44 Avenue Farhat Hached",
    city: "Nabeul",
    postalCode: "8000",
    governorate: "Nabeul",
    country: "TN",
  },
  ines: {
    fullName: "Inès Chouchène",
    phone: "+216 24 880 451",
    street: "12 Rue des Orangers",
    city: "Nabeul",
    postalCode: "8000",
    governorate: "Nabeul",
    country: "TN",
  },
  mohamed: {
    fullName: "Mohamed Ben Ali",
    phone: "+216 99 540 218",
    street: "62 Avenue Habib Bourguiba",
    city: "Tunis",
    postalCode: "1000",
    governorate: "Tunis",
    country: "TN",
  },
  fatma: {
    fullName: "Fatma Trabelsi",
    phone: "+216 28 305 661",
    street: "8 Rue de Marseille",
    city: "Tunis",
    postalCode: "1001",
    governorate: "Tunis",
    country: "TN",
  },
  karim: {
    fullName: "Karim Zouari",
    phone: "+216 92 117 884",
    street: "23 Rue d'Alger",
    city: "Le Bardo",
    postalCode: "2000",
    governorate: "Tunis",
    country: "TN",
  },
  leila: {
    fullName: "Leila Hamdi",
    phone: "+216 23 446 902",
    street: "5 Rue Sidi Bou Said",
    city: "La Marsa",
    postalCode: "2078",
    governorate: "Tunis",
    country: "TN",
  },
  ahmed: {
    fullName: "Ahmed Khelifi",
    phone: "+216 55 627 134",
    street: "17 Avenue de Carthage",
    city: "Tunis",
    postalCode: "1002",
    governorate: "Tunis",
    country: "TN",
  },
  yasmine: {
    fullName: "Yasmine Ben Said",
    phone: "+216 26 158 740",
    street: "11 Avenue Habib Bourguiba",
    city: "Sousse",
    postalCode: "4000",
    governorate: "Sousse",
    country: "TN",
  },
  omar: {
    fullName: "Omar Bouaziz",
    phone: "+216 51 920 388",
    street: "33 Rue de la Liberté",
    city: "Hammam Sousse",
    postalCode: "4011",
    governorate: "Sousse",
    country: "TN",
  },
  salmaB: {
    fullName: "Salma Bouzid",
    phone: "+216 97 343 015",
    street: "7 Rue Ibn Sina",
    city: "Msaken",
    postalCode: "4070",
    governorate: "Sousse",
    country: "TN",
  },
  youssef: {
    fullName: "Youssef Mansouri",
    phone: "+216 29 074 218",
    street: "29 Avenue de la Liberté",
    city: "Sfax",
    postalCode: "3000",
    governorate: "Sfax",
    country: "TN",
  },
  asma: {
    fullName: "Asma Feki",
    phone: "+216 53 781 220",
    street: "4 Rue Ibn Khaldoun",
    city: "Sfax",
    postalCode: "3000",
    governorate: "Sfax",
    country: "TN",
  },
  bilel: {
    fullName: "Bilel Gargouri",
    phone: "+216 90 414 657",
    street: "21 Avenue Hedi Chaker",
    city: "Sakiet Ezzit",
    postalCode: "3021",
    governorate: "Sfax",
    country: "TN",
  },
  khaled: {
    fullName: "Khaled Belhaj",
    phone: "+216 54 211 866",
    street: "16 Rue de la République",
    city: "Bizerte",
    postalCode: "7000",
    governorate: "Bizerte",
    country: "TN",
  },
  hela: {
    fullName: "Hela Zribi",
    phone: "+216 22 988 405",
    street: "3 Avenue Tahar Sfar",
    city: "Menzel Bourguiba",
    postalCode: "7050",
    governorate: "Bizerte",
    country: "TN",
  },
  skander: {
    fullName: "Skander Naffeti",
    phone: "+216 26 553 712",
    street: "10 Avenue Habib Bourguiba",
    city: "Monastir",
    postalCode: "5000",
    governorate: "Monastir",
    country: "TN",
  },
  mariem: {
    fullName: "Mariem Ayari",
    phone: "+216 95 174 309",
    street: "25 Rue de l'Indépendance",
    city: "Ksar Hellal",
    postalCode: "5070",
    governorate: "Monastir",
    country: "TN",
  },
  anouar: {
    fullName: "Anouar Dridi",
    phone: "+216 20 366 951",
    street: "8 Avenue de la République",
    city: "Kairouan",
    postalCode: "3100",
    governorate: "Kairouan",
    country: "TN",
  },
  syrine: {
    fullName: "Syrine Cherni",
    phone: "+216 52 740 188",
    street: "13 Rue du Borj",
    city: "Mahdia",
    postalCode: "5100",
    governorate: "Mahdia",
    country: "TN",
  },
  // Walk-in pickup — Jasmin Médical Store, Nabeul (mirrors apps/admin/lib/shop-info.ts).
  shop: {
    fullName: "Retrait magasin",
    phone: "+216 72 289 900",
    street: "111 Av. Hedi Nouira",
    city: "Nabeul",
    postalCode: "8000",
    governorate: "Nabeul",
    country: "TN",
  },
} as const;

// ---------------------------------------------------------------------------
// Orders — 50 entries
//
// Layout (chronological, oldest → newest):
//   62–85d ago : 8 orders (delivered + 1 refunded)        — older window
//   32–58d ago : 8 orders (delivered, walk-ins, cancelled, refunded)
//   18–28d ago : 9 orders (delivered, walk-in, refunded)  — recent window starts
//   10–17d ago : 7 orders (delivered, walk-in, cancelled, refunded)
//    4–8d  ago : 8 orders (delivered, walk-in, shipped, refunded)
//    2–3d  ago : 7 orders (delivered, walk-in, preparing, cancelled)
//    0–1d  ago : 9 orders (confirmed, pending, cancelled)
// ---------------------------------------------------------------------------

export const EXTENDED_ORDER_SEED: ExtendedSeedOrder[] = [
  // ===========================================================================
  // OLDER WINDOW — 30 to 90 days ago (~17 orders)
  // ===========================================================================

  // --- 85 days ago (mid-week flurry) -----------------------------------------
  {
    orderNumber: "JMS-2026-000100",
    origin: "web_customer",
    customerEmail: "mehdi.bouzguenda@gmail.com",
    shipping: ADDR.mehdi,
    items: [
      { productSlug: "tensio-omron-m3", quantity: 1 },
      { productSlug: "bandelettes-accuchek", variantSku: "ACK-BD-50", quantity: 2 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 85,
    hourOfDay: 10,
    notesCustomer: null,
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000101",
    origin: "web_guest",
    guestEmail: "leila.guest85@gmail.com",
    guestPhone: "+216 95 808 412",
    shipping: {
      fullName: "Leila Cherif",
      phone: "+216 95 808 412",
      street: "21 Avenue de France",
      city: "Tunis",
      postalCode: "1000",
      governorate: "Tunis",
      country: "TN",
    },
    items: [{ productSlug: "bioderma-sensibio-h2o", variantSku: "BIO-SEN-500", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 84,
    hourOfDay: 11,
    notesCustomer: null,
    notesInternal: null,
  },

  // --- 76–78 days ago --------------------------------------------------------
  {
    orderNumber: "JMS-2026-000102",
    origin: "web_customer",
    customerEmail: "youssef.mansouri@gmail.com",
    shipping: ADDR.youssef,
    items: [
      { productSlug: "ceinture-lombaire", variantSku: "ORT-LOM-L", quantity: 1 },
      { productSlug: "lrp-cicaplast-baume", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 78,
    hourOfDay: 16,
    notesCustomer: "Merci d'appeler avant la livraison.",
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000103",
    origin: "walk_in",
    customerEmail: "ines.chouchene@yahoo.fr",
    shipping: ADDR.shop,
    items: [
      { productSlug: "nuxe-huile-prodigieuse", variantSku: "NUX-HP-100", quantity: 1 },
      { productSlug: "nuxe-reve-de-miel", quantity: 2 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 76,
    hourOfDay: 17,
    notesCustomer: null,
    notesInternal: "Vente magasin — facture remise au client.",
  },

  // --- 70 days ago -----------------------------------------------------------
  {
    orderNumber: "JMS-2026-000104",
    origin: "web_customer",
    customerEmail: "ahmed.khelifi@yahoo.fr",
    shipping: ADDR.ahmed,
    items: [{ productSlug: "fauteuil-roulant-standard", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 70,
    hourOfDay: 9,
    notesCustomer: null,
    notesInternal: "Livraison confirmée par téléphone — créneau samedi matin.",
  },

  // --- 62 days ago — refunded ------------------------------------------------
  {
    orderNumber: "JMS-2026-000105",
    origin: "web_customer",
    customerEmail: "khaled.belhaj@gmail.com",
    shipping: ADDR.khaled,
    items: [{ productSlug: "tensio-omron-m7", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "refunded",
    daysAgo: 62,
    hourOfDay: 10,
    notesCustomer: null,
    notesInternal: "Produit retourné — remboursement validé le 10/03 (défaut écran).",
  },

  // --- 57–58 days ago --------------------------------------------------------
  {
    orderNumber: "JMS-2026-000106",
    origin: "web_guest",
    guestEmail: "rania.guest58@yahoo.fr",
    guestPhone: "+216 22 657 901",
    shipping: {
      fullName: "Rania Khalfaoui",
      phone: "+216 22 657 901",
      street: "5 Rue de la Plage",
      city: "Hammamet",
      postalCode: "8050",
      governorate: "Nabeul",
      country: "TN",
    },
    items: [
      { productSlug: "svr-sun-secure-spf50", variantSku: "SVR-SUN-LT-200", quantity: 1 },
      { productSlug: "svr-sebiaclear-creme", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 58,
    hourOfDay: 15,
    notesCustomer: null,
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000107",
    origin: "walk_in",
    guestPhone: "+216 98 332 005",
    shipping: ADDR.shop,
    items: [
      { productSlug: "thermometre-frontal", quantity: 1 },
      { productSlug: "compresses-steriles", quantity: 4 },
      { productSlug: "liniment-oleocalcaire", quantity: 2 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 57,
    hourOfDay: 11,
    notesCustomer: null,
    notesInternal: "Vente magasin — client de passage, paiement espèces.",
  },

  // --- 52 days ago — cancelled before confirmation ---------------------------
  {
    orderNumber: "JMS-2026-000108",
    origin: "web_customer",
    customerEmail: "asma.feki@yahoo.fr",
    shipping: ADDR.asma,
    items: [
      { productSlug: "vichy-capital-soleil", variantSku: "VIC-CAP-CR-50", quantity: 1 },
      { productSlug: "lrp-anthelios-spf50", variantSku: "LRP-ANT-CR-50", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "cancelled",
    daysAgo: 52,
    hourOfDay: 19,
    notesCustomer: "Annulation — j'ai trouvé en pharmacie de garde.",
    notesInternal: "Annulation client par téléphone.",
  },

  // --- 46 days ago -----------------------------------------------------------
  {
    orderNumber: "JMS-2026-000109",
    origin: "web_customer",
    customerEmail: "rim.jebali@gmail.com",
    shipping: ADDR.rim,
    items: [
      { productSlug: "mustela-2en1-gel", variantSku: "MUS-2EN1-500", quantity: 1 },
      { productSlug: "mustela-hydra-bebe", quantity: 1 },
      { productSlug: "liniment-oleocalcaire", quantity: 2 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 46,
    hourOfDay: 10,
    notesCustomer: "Sonner à l'interphone Jebali, 2e étage.",
    notesInternal: null,
  },

  // --- 42 days ago — refunded ------------------------------------------------
  {
    orderNumber: "JMS-2026-000110",
    origin: "web_customer",
    customerEmail: "salma.bouzid@hotmail.com",
    shipping: ADDR.salmaB,
    items: [
      { productSlug: "vichy-liftactiv-serum", quantity: 1 },
      { productSlug: "nuxe-creme-fraiche", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "refunded",
    daysAgo: 42,
    hourOfDay: 14,
    notesCustomer: null,
    notesInternal: "Remboursement après retour — flacon de sérum reçu endommagé.",
  },

  // --- 40 days ago -----------------------------------------------------------
  {
    orderNumber: "JMS-2026-000111",
    origin: "web_guest",
    guestEmail: "kamel.guest40@hotmail.com",
    guestPhone: "+216 53 220 117",
    shipping: {
      fullName: "Kamel Bouzayene",
      phone: "+216 53 220 117",
      street: "44 Rue Tanit",
      city: "Bizerte",
      postalCode: "7000",
      governorate: "Bizerte",
      country: "TN",
    },
    items: [{ productSlug: "lecteur-glycemie-accuchek", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 40,
    hourOfDay: 16,
    notesCustomer: null,
    notesInternal: null,
  },

  // --- 35 days ago — walk-in mini-flurry -------------------------------------
  {
    orderNumber: "JMS-2026-000112",
    origin: "walk_in",
    customerEmail: "nizar.hammami@gmail.com",
    shipping: ADDR.shop,
    items: [
      { productSlug: "forte-pharma-energie", quantity: 2 },
      { productSlug: "nuxe-reve-de-miel", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 35,
    hourOfDay: 9,
    notesCustomer: null,
    notesInternal: "Vente magasin — comptoir.",
  },
  {
    orderNumber: "JMS-2026-000113",
    origin: "walk_in",
    guestPhone: "+216 27 411 856",
    shipping: ADDR.shop,
    items: [
      { productSlug: "ceinture-lombaire", variantSku: "ORT-LOM-XL", quantity: 1 },
      { productSlug: "canne-anglaise", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 35,
    hourOfDay: 10,
    notesCustomer: null,
    notesInternal: "Vente magasin — client recommandé par le médecin.",
  },

  // --- 32 days ago — cancelled (out of stock) --------------------------------
  {
    orderNumber: "JMS-2026-000114",
    origin: "web_guest",
    guestEmail: "samir.guest32@gmail.com",
    guestPhone: "+216 50 901 224",
    shipping: {
      fullName: "Samir Bouhageb",
      phone: "+216 50 901 224",
      street: "7 Avenue Habib Bourguiba",
      city: "Sousse",
      postalCode: "4000",
      governorate: "Sousse",
      country: "TN",
    },
    items: [{ productSlug: "fauteuil-roulant-xl", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "cancelled",
    daysAgo: 32,
    hourOfDay: 11,
    notesCustomer: null,
    notesInternal: "Annulation — rupture fournisseur, client prévenu, recommande dans 2 semaines.",
  },

  // ===========================================================================
  // RECENT WINDOW — last 30 days
  // ===========================================================================

  // --- 27–28 days ago --------------------------------------------------------
  {
    orderNumber: "JMS-2026-000115",
    origin: "web_customer",
    customerEmail: "amina.sassi@yahoo.fr",
    shipping: ADDR.amina,
    items: [
      { productSlug: "bioderma-sensibio-h2o", variantSku: "BIO-SEN-250", quantity: 2 },
      { productSlug: "bioderma-sebium-pore", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 28,
    hourOfDay: 13,
    notesCustomer: null,
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000116",
    origin: "web_customer",
    customerEmail: "hassen.oueslati@topnet.tn",
    shipping: ADDR.hassen,
    items: [
      { productSlug: "svr-sun-secure-spf50", variantSku: "SVR-SUN-BR-200", quantity: 1 },
      { productSlug: "vichy-capital-soleil", variantSku: "VIC-CAP-LC-300", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 27,
    hourOfDay: 17,
    notesCustomer: null,
    notesInternal: null,
  },

  // --- 24 days ago — refunded ------------------------------------------------
  {
    orderNumber: "JMS-2026-000117",
    origin: "web_customer",
    customerEmail: "karim.zouari@topnet.tn",
    shipping: ADDR.karim,
    items: [
      { productSlug: "aerosol-pneumatique", quantity: 1 },
      { productSlug: "compresses-steriles", quantity: 2 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "refunded",
    daysAgo: 24,
    hourOfDay: 10,
    notesCustomer: null,
    notesInternal: "Remboursement — masque pédiatrique manquant à la livraison.",
  },

  // --- 22 days ago -----------------------------------------------------------
  {
    orderNumber: "JMS-2026-000118",
    origin: "web_customer",
    customerEmail: "skander.naffeti@gmail.com",
    shipping: ADDR.skander,
    items: [
      { productSlug: "lrp-cicaplast-baume", quantity: 2 },
      { productSlug: "avene-eau-thermale", variantSku: "AVE-EAU-150", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 22,
    hourOfDay: 9,
    notesCustomer: "Livrer après 18h si possible.",
    notesInternal: null,
  },

  // --- 20 days ago — flurry --------------------------------------------------
  {
    orderNumber: "JMS-2026-000119",
    origin: "web_customer",
    customerEmail: "syrine.cherni@yahoo.fr",
    shipping: ADDR.syrine,
    items: [
      { productSlug: "nuxe-huile-prodigieuse", variantSku: "NUX-HP-50", quantity: 1 },
      { productSlug: "nuxe-creme-fraiche", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 20,
    hourOfDay: 14,
    notesCustomer: null,
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000120",
    origin: "web_guest",
    guestEmail: "nadia.guest20@gmail.com",
    guestPhone: "+216 24 778 003",
    shipping: {
      fullName: "Nadia Mahjoub",
      phone: "+216 24 778 003",
      street: "12 Avenue de Carthage",
      city: "La Marsa",
      postalCode: "2078",
      governorate: "Tunis",
      country: "TN",
    },
    items: [
      { productSlug: "bioderma-atoderm-creme", quantity: 1 },
      { productSlug: "mustela-hydra-bebe", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 20,
    hourOfDay: 18,
    notesCustomer: null,
    notesInternal: null,
  },

  // --- 18 days ago -----------------------------------------------------------
  {
    orderNumber: "JMS-2026-000121",
    origin: "walk_in",
    customerEmail: "walid.bouaziz@hotmail.com",
    shipping: ADDR.shop,
    items: [
      { productSlug: "thermometre-frontal", quantity: 1 },
      { productSlug: "forte-pharma-energie", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 18,
    hourOfDay: 12,
    notesCustomer: null,
    notesInternal: "Vente magasin — comptoir, sachet remis.",
  },
  {
    orderNumber: "JMS-2026-000122",
    origin: "web_customer",
    customerEmail: "mohamed.benali@gmail.com",
    shipping: ADDR.mohamed,
    items: [
      { productSlug: "bandelettes-accuchek", variantSku: "ACK-BD-100", quantity: 1 },
      { productSlug: "lecteur-glycemie-accuchek", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 17,
    hourOfDay: 10,
    notesCustomer: "Pour mon père — merci d'éviter le créneau midi.",
    notesInternal: null,
  },

  // --- 15 days ago -----------------------------------------------------------
  {
    orderNumber: "JMS-2026-000123",
    origin: "web_customer",
    customerEmail: "yasmine.bensaid@gmail.com",
    shipping: ADDR.yasmine,
    items: [
      { productSlug: "vichy-mineral-89", quantity: 1 },
      { productSlug: "lrp-effaclar-duo", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 15,
    hourOfDay: 13,
    notesCustomer: null,
    notesInternal: null,
  },

  // --- 13 days ago — cancelled ----------------------------------------------
  {
    orderNumber: "JMS-2026-000124",
    origin: "web_customer",
    customerEmail: "hela.zribi@hotmail.com",
    shipping: ADDR.hela,
    items: [{ productSlug: "fauteuil-roulant-standard", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "cancelled",
    daysAgo: 13,
    hourOfDay: 19,
    notesCustomer: "J'annule, je vais récupérer en magasin.",
    notesInternal: "Annulation client — sera converti en retrait magasin.",
  },

  // --- 12 days ago — refunded ------------------------------------------------
  {
    orderNumber: "JMS-2026-000125",
    origin: "web_guest",
    guestEmail: "olfa.guest12@yahoo.fr",
    guestPhone: "+216 26 551 099",
    shipping: {
      fullName: "Olfa Tlili",
      phone: "+216 26 551 099",
      street: "9 Avenue de la Plage",
      city: "Hammamet",
      postalCode: "8050",
      governorate: "Nabeul",
      country: "TN",
    },
    items: [{ productSlug: "vichy-liftactiv-serum", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "refunded",
    daysAgo: 12,
    hourOfDay: 11,
    notesCustomer: null,
    notesInternal: "Remboursement — produit ne convient pas (rougeurs).",
  },

  // --- 10 days ago — flurry --------------------------------------------------
  {
    orderNumber: "JMS-2026-000126",
    origin: "web_customer",
    customerEmail: "ines.chouchene@yahoo.fr",
    shipping: ADDR.ines,
    items: [
      { productSlug: "avene-cleanance-gel", variantSku: "AVE-CLG-200", quantity: 1 },
      { productSlug: "bioderma-sebium-pore", quantity: 1 },
      { productSlug: "lrp-cicaplast-baume", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 10,
    hourOfDay: 11,
    notesCustomer: null,
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000127",
    origin: "walk_in",
    guestPhone: "+216 92 410 668",
    shipping: ADDR.shop,
    items: [
      { productSlug: "compresses-steriles", quantity: 5 },
      { productSlug: "liniment-oleocalcaire", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 10,
    hourOfDay: 15,
    notesCustomer: null,
    notesInternal: "Vente magasin — passage rapide.",
  },

  // --- 8 days ago ------------------------------------------------------------
  {
    orderNumber: "JMS-2026-000128",
    origin: "walk_in",
    customerEmail: "sonia.mejri@planet.tn",
    shipping: ADDR.shop,
    items: [
      { productSlug: "nuxe-huile-prodigieuse", variantSku: "NUX-HP-50", quantity: 1 },
      { productSlug: "avene-eau-thermale", variantSku: "AVE-EAU-50", quantity: 2 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 8,
    hourOfDay: 16,
    notesCustomer: null,
    notesInternal: "Vente magasin — fidèle, paiement en espèces.",
  },
  {
    orderNumber: "JMS-2026-000129",
    origin: "web_customer",
    customerEmail: "khaled.belhaj@gmail.com",
    shipping: ADDR.khaled,
    items: [
      { productSlug: "ceinture-lombaire", variantSku: "ORT-LOM-M", quantity: 1 },
      { productSlug: "genouillere-ligamentaire", variantSku: "ORT-GEN-M", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "shipped",
    daysAgo: 8,
    hourOfDay: 10,
    notesCustomer: null,
    notesInternal: "Expédié via livreur Nabeul-Bizerte — ETA 1-2 jours.",
  },

  // --- 6 days ago ------------------------------------------------------------
  {
    orderNumber: "JMS-2026-000130",
    origin: "web_customer",
    customerEmail: "fatma.trabelsi@hotmail.com",
    shipping: ADDR.fatma,
    items: [{ productSlug: "vichy-capital-soleil", variantSku: "VIC-CAP-CR-50", quantity: 2 }],
    paymentMethod: "cash_on_delivery",
    status: "shipped",
    daysAgo: 6,
    hourOfDay: 14,
    notesCustomer: null,
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000131",
    origin: "web_guest",
    guestEmail: "imen.guest6@hotmail.com",
    guestPhone: "+216 99 220 471",
    shipping: {
      fullName: "Imen Saidi",
      phone: "+216 99 220 471",
      street: "16 Rue des Jasmins",
      city: "Sfax",
      postalCode: "3000",
      governorate: "Sfax",
      country: "TN",
    },
    items: [
      { productSlug: "mustela-2en1-gel", variantSku: "MUS-2EN1-200", quantity: 1 },
      { productSlug: "liniment-oleocalcaire", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "shipped",
    daysAgo: 6,
    hourOfDay: 17,
    notesCustomer: "Appelez avant — interphone parfois en panne.",
    notesInternal: null,
  },

  // --- 5 days ago — refunded ------------------------------------------------
  {
    orderNumber: "JMS-2026-000132",
    origin: "web_customer",
    customerEmail: "leila.hamdi@gmail.com",
    shipping: ADDR.leila,
    items: [{ productSlug: "tensio-omron-m7", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "refunded",
    daysAgo: 5,
    hourOfDay: 11,
    notesCustomer: null,
    notesInternal: "Remboursement après livraison — appareil ne s'allumait pas, échange impossible.",
  },

  // --- 4 days ago ------------------------------------------------------------
  {
    orderNumber: "JMS-2026-000133",
    origin: "web_customer",
    customerEmail: "rim.jebali@gmail.com",
    shipping: ADDR.rim,
    items: [
      { productSlug: "svr-densitium-creme", quantity: 1 },
      { productSlug: "vichy-mineral-89", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "shipped",
    daysAgo: 4,
    hourOfDay: 9,
    notesCustomer: null,
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000134",
    origin: "web_customer",
    customerEmail: "youssef.mansouri@gmail.com",
    shipping: ADDR.youssef,
    items: [
      { productSlug: "bandelettes-accuchek", variantSku: "ACK-BD-25", quantity: 2 },
      { productSlug: "thermometre-frontal", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "shipped",
    daysAgo: 4,
    hourOfDay: 13,
    notesCustomer: null,
    notesInternal: "Rappel téléphonique effectué le 25/04 — confirmé pour livraison vendredi.",
  },

  // --- 3 days ago — flurry ---------------------------------------------------
  {
    orderNumber: "JMS-2026-000135",
    origin: "web_customer",
    customerEmail: "nizar.hammami@gmail.com",
    shipping: ADDR.nizar,
    items: [
      { productSlug: "lrp-anthelios-spf50", variantSku: "LRP-ANT-CR-50", quantity: 1 },
      { productSlug: "avene-hydrance-creme", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "preparing",
    daysAgo: 3,
    hourOfDay: 10,
    notesCustomer: null,
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000136",
    origin: "web_customer",
    customerEmail: "amina.sassi@yahoo.fr",
    shipping: ADDR.amina,
    items: [{ productSlug: "nuxe-reve-de-miel", quantity: 4 }],
    paymentMethod: "cash_on_delivery",
    status: "preparing",
    daysAgo: 3,
    hourOfDay: 11,
    notesCustomer: null,
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000137",
    origin: "web_guest",
    guestEmail: "sami.guest3@gmail.com",
    guestPhone: "+216 28 661 902",
    shipping: {
      fullName: "Sami Ben Romdhane",
      phone: "+216 28 661 902",
      street: "11 Avenue Habib Bourguiba",
      city: "Monastir",
      postalCode: "5000",
      governorate: "Monastir",
      country: "TN",
    },
    items: [
      { productSlug: "canne-anglaise", quantity: 1 },
      { productSlug: "chevillere-ajustable", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "preparing",
    daysAgo: 3,
    hourOfDay: 14,
    notesCustomer: null,
    notesInternal: null,
  },

  // --- 2 days ago ------------------------------------------------------------
  {
    orderNumber: "JMS-2026-000138",
    origin: "walk_in",
    customerEmail: "mehdi.bouzguenda@gmail.com",
    shipping: ADDR.shop,
    items: [
      { productSlug: "forte-pharma-energie", quantity: 1 },
      { productSlug: "nuxe-huile-prodigieuse", variantSku: "NUX-HP-100", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 2,
    hourOfDay: 17,
    notesCustomer: null,
    notesInternal: "Vente magasin — passage en fin de journée.",
  },
  {
    orderNumber: "JMS-2026-000139",
    origin: "web_customer",
    customerEmail: "asma.feki@yahoo.fr",
    shipping: ADDR.asma,
    items: [
      { productSlug: "bioderma-sensibio-h2o", variantSku: "BIO-SEN-500", quantity: 1 },
      { productSlug: "bioderma-atoderm-creme", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "preparing",
    daysAgo: 2,
    hourOfDay: 10,
    notesCustomer: null,
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000140",
    origin: "web_customer",
    customerEmail: "skander.naffeti@gmail.com",
    shipping: ADDR.skander,
    items: [{ productSlug: "aerosol-pneumatique", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "preparing",
    daysAgo: 2,
    hourOfDay: 12,
    notesCustomer: "Merci d'inclure une notice française si possible.",
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000141",
    origin: "web_customer",
    customerEmail: "hela.zribi@hotmail.com",
    shipping: ADDR.hela,
    items: [
      { productSlug: "bequille-axillaire", quantity: 1 },
      { productSlug: "chevillere-ajustable", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "cancelled",
    daysAgo: 2,
    hourOfDay: 18,
    notesCustomer: null,
    notesInternal: "Annulation — client a confirmé l'achat ailleurs.",
  },

  // --- 1 day ago — flurry ----------------------------------------------------
  {
    orderNumber: "JMS-2026-000142",
    origin: "web_customer",
    customerEmail: "salma.bouzid@hotmail.com",
    shipping: ADDR.salmaB,
    items: [
      { productSlug: "svr-sun-secure-spf50", variantSku: "SVR-SUN-CR-50", quantity: 1 },
      { productSlug: "svr-sebiaclear-creme", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "confirmed",
    daysAgo: 1,
    hourOfDay: 9,
    notesCustomer: null,
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000143",
    origin: "web_customer",
    customerEmail: "ahmed.khelifi@yahoo.fr",
    shipping: ADDR.ahmed,
    items: [
      { productSlug: "vichy-capital-soleil", variantSku: "VIC-CAP-LC-300", quantity: 1 },
      { productSlug: "lrp-anthelios-spf50", variantSku: "LRP-ANT-FL-50", quantity: 1 },
      { productSlug: "avene-eau-thermale", variantSku: "AVE-EAU-300", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "confirmed",
    daysAgo: 1,
    hourOfDay: 11,
    notesCustomer: null,
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000144",
    origin: "web_guest",
    guestEmail: "houda.guest1@gmail.com",
    guestPhone: "+216 23 770 156",
    shipping: {
      fullName: "Houda Latrach",
      phone: "+216 23 770 156",
      street: "5 Rue Hedi Chaker",
      city: "Korba",
      postalCode: "8070",
      governorate: "Nabeul",
      country: "TN",
    },
    items: [
      { productSlug: "mustela-hydra-bebe", quantity: 1 },
      { productSlug: "liniment-oleocalcaire", quantity: 2 },
      { productSlug: "compresses-steriles", quantity: 2 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "confirmed",
    daysAgo: 1,
    hourOfDay: 14,
    notesCustomer: "Cadeau pour la naissance — emballage soigné si possible.",
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000145",
    origin: "web_customer",
    customerEmail: "bilel.gargouri@topnet.tn",
    shipping: ADDR.bilel,
    items: [
      { productSlug: "tensio-omron-m3", quantity: 1 },
      { productSlug: "bandelettes-accuchek", variantSku: "ACK-BD-50", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "confirmed",
    daysAgo: 1,
    hourOfDay: 18,
    notesCustomer: null,
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000146",
    origin: "web_customer",
    customerEmail: "mariem.ayari@planet.tn",
    shipping: ADDR.mariem,
    items: [
      { productSlug: "genouillere-ligamentaire", variantSku: "ORT-GEN-L", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "confirmed",
    daysAgo: 1,
    hourOfDay: 20,
    notesCustomer: null,
    notesInternal: null,
  },

  // --- 1 day ago — cancelled (guest, before any prep) -----------------------
  {
    orderNumber: "JMS-2026-000147",
    origin: "web_guest",
    guestEmail: "hatem.guest1@yahoo.fr",
    guestPhone: "+216 22 109 663",
    shipping: {
      fullName: "Hatem Bouguerra",
      phone: "+216 22 109 663",
      street: "18 Avenue de la Liberté",
      city: "Sfax",
      postalCode: "3000",
      governorate: "Sfax",
      country: "TN",
    },
    items: [
      { productSlug: "svr-sebiaclear-gel-moussant", quantity: 1 },
      { productSlug: "lrp-effaclar-duo", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "cancelled",
    daysAgo: 1,
    hourOfDay: 21,
    notesCustomer: "Erreur d'adresse, je recommande demain.",
    notesInternal: "Annulation à la demande du client (mauvaise adresse).",
  },

  // --- Today — pending bucket ------------------------------------------------
  {
    orderNumber: "JMS-2026-000148",
    origin: "web_customer",
    customerEmail: "syrine.cherni@yahoo.fr",
    shipping: ADDR.syrine,
    items: [{ productSlug: "vichy-mineral-89", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "pending",
    daysAgo: 0,
    hourOfDay: 10,
    notesCustomer: null,
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000149",
    origin: "web_customer",
    customerEmail: "omar.bouaziz@planet.tn",
    shipping: ADDR.omar,
    items: [
      { productSlug: "ceinture-lombaire", variantSku: "ORT-LOM-S", quantity: 1 },
      { productSlug: "bequille-axillaire", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "pending",
    daysAgo: 0,
    hourOfDay: 11,
    notesCustomer: "Pour mon époux après opération — merci.",
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000150",
    origin: "web_guest",
    guestEmail: "wassim.guest0@gmail.com",
    guestPhone: "+216 54 998 220",
    shipping: {
      fullName: "Wassim Brahmi",
      phone: "+216 54 998 220",
      street: "33 Rue de la République",
      city: "Bizerte",
      postalCode: "7000",
      governorate: "Bizerte",
      country: "TN",
    },
    items: [
      { productSlug: "nuxe-creme-fraiche", quantity: 1 },
      { productSlug: "nuxe-huile-prodigieuse", variantSku: "NUX-HP-50", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "pending",
    daysAgo: 0,
    hourOfDay: 13,
    notesCustomer: null,
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000151",
    origin: "web_customer",
    customerEmail: "anouar.dridi@gmail.com",
    shipping: ADDR.anouar,
    items: [
      { productSlug: "thermometre-frontal", quantity: 1 },
      { productSlug: "compresses-steriles", quantity: 3 },
      { productSlug: "liniment-oleocalcaire", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "pending",
    daysAgo: 0,
    hourOfDay: 16,
    notesCustomer: null,
    notesInternal: null,
  },
  {
    orderNumber: "JMS-2026-000152",
    origin: "web_customer",
    customerEmail: "hassen.oueslati@topnet.tn",
    shipping: ADDR.hassen,
    items: [
      { productSlug: "avene-cleanance-gel", variantSku: "AVE-CLG-400", quantity: 1 },
      { productSlug: "lrp-cicaplast-baume", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "pending",
    daysAgo: 0,
    hourOfDay: 17,
    notesCustomer: null,
    notesInternal: null,
  },
];
