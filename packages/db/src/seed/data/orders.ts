export interface SeedOrderItem {
  productSlug: string;
  variantSku?: string;
  quantity: number;
}
export interface SeedOrder {
  orderNumber: string;
  customerEmail?: string;
  guestEmail?: string;
  guestPhone?: string;
  shipping: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    postalCode: string;
    governorate: string;
  };
  items: SeedOrderItem[];
  paymentMethod: "cash_on_delivery" | "card_konnect" | "card_clic_to_pay" | "bank_transfer";
  status: "pending" | "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled";
  daysAgo: number;
}

export const ORDER_SEED: SeedOrder[] = [
  {
    orderNumber: "JMS-2026-000001",
    customerEmail: "salma.benali@example.tn",
    shipping: {
      fullName: "Salma Ben Ali",
      phone: "+216 22 110 220",
      street: "12 rue Ibn Khaldoun",
      city: "Nabeul",
      postalCode: "8000",
      governorate: "Nabeul",
    },
    items: [
      { productSlug: "svr-sebiaclear-creme", quantity: 2 },
      { productSlug: "avene-eau-thermale", variantSku: "AVE-EAU-150", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 28,
  },
  {
    orderNumber: "JMS-2026-000002",
    customerEmail: "mohamed.trabelsi@example.tn",
    shipping: {
      fullName: "Mohamed Trabelsi",
      phone: "+216 98 233 411",
      street: "45 av. de la Liberté",
      city: "Tunis",
      postalCode: "1002",
      governorate: "Tunis",
    },
    items: [{ productSlug: "tensio-omron-m3", quantity: 1 }],
    paymentMethod: "card_konnect",
    status: "delivered",
    daysAgo: 25,
  },
  {
    orderNumber: "JMS-2026-000003",
    customerEmail: "yasmine.bouzid@example.tn",
    shipping: {
      fullName: "Yasmine Bouzid",
      phone: "+216 24 556 178",
      street: "9 rue des Jasmins",
      city: "Sfax",
      postalCode: "3000",
      governorate: "Sfax",
    },
    items: [
      { productSlug: "nuxe-huile-prodigieuse", variantSku: "NUX-HP-100", quantity: 1 },
      { productSlug: "nuxe-creme-fraiche", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 22,
  },
  {
    orderNumber: "JMS-2026-000004",
    customerEmail: "karim.mansouri@example.tn",
    shipping: {
      fullName: "Karim Mansouri",
      phone: "+216 95 774 332",
      street: "30 av. Habib Bourguiba",
      city: "Sousse",
      postalCode: "4000",
      governorate: "Sousse",
    },
    items: [{ productSlug: "fauteuil-roulant-standard", quantity: 1 }],
    paymentMethod: "bank_transfer",
    status: "shipped",
    daysAgo: 5,
  },
  {
    orderNumber: "JMS-2026-000005",
    guestEmail: "fatma.guest@example.tn",
    guestPhone: "+216 92 555 333",
    shipping: {
      fullName: "Fatma Cherif",
      phone: "+216 92 555 333",
      street: "8 rue du Lac",
      city: "Hammamet",
      postalCode: "8050",
      governorate: "Nabeul",
    },
    items: [
      { productSlug: "vichy-mineral-89", quantity: 1 },
      { productSlug: "lrp-cicaplast-baume", quantity: 2 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "preparing",
    daysAgo: 1,
  },
  {
    orderNumber: "JMS-2026-000006",
    customerEmail: "nour.bensalah@example.tn",
    shipping: {
      fullName: "Nour Ben Salah",
      phone: "+216 27 882 011",
      street: "5 rue de la Plage",
      city: "Nabeul",
      postalCode: "8000",
      governorate: "Nabeul",
    },
    items: [{ productSlug: "bioderma-sensibio-h2o", variantSku: "BIO-SEN-500", quantity: 2 }],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 18,
  },
  {
    orderNumber: "JMS-2026-000007",
    customerEmail: "ahmed.karoui@example.tn",
    shipping: {
      fullName: "Ahmed Karoui",
      phone: "+216 50 113 274",
      street: "11 rue Tanit",
      city: "Bizerte",
      postalCode: "7000",
      governorate: "Bizerte",
    },
    items: [
      { productSlug: "lecteur-glycemie-accuchek", quantity: 1 },
      { productSlug: "bandelettes-accuchek", variantSku: "ACK-BD-50", quantity: 2 },
    ],
    paymentMethod: "card_clic_to_pay",
    status: "delivered",
    daysAgo: 14,
  },
  {
    orderNumber: "JMS-2026-000008",
    customerEmail: "imen.gharbi@example.tn",
    shipping: {
      fullName: "Imen Gharbi",
      phone: "+216 21 990 008",
      street: "22 rue de Mahdia",
      city: "Monastir",
      postalCode: "5000",
      governorate: "Monastir",
    },
    items: [{ productSlug: "ceinture-lombaire", variantSku: "ORT-LOM-M", quantity: 1 }],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 10,
  },
  {
    orderNumber: "JMS-2026-000009",
    customerEmail: "wassim.benammar@example.tn",
    shipping: {
      fullName: "Wassim Ben Ammar",
      phone: "+216 99 102 654",
      street: "12 rue Ali Bach Hamba",
      city: "Tunis",
      postalCode: "1001",
      governorate: "Tunis",
    },
    items: [
      { productSlug: "lrp-effaclar-duo", quantity: 1 },
      { productSlug: "lrp-anthelios-spf50", variantSku: "LRP-ANT-FL-50", quantity: 1 },
    ],
    paymentMethod: "card_konnect",
    status: "delivered",
    daysAgo: 8,
  },
  {
    orderNumber: "JMS-2026-000010",
    customerEmail: "houda.mejri@example.tn",
    shipping: {
      fullName: "Houda Mejri",
      phone: "+216 28 114 887",
      street: "3 av. Mediterranée",
      city: "Hammamet",
      postalCode: "8050",
      governorate: "Nabeul",
    },
    items: [
      { productSlug: "mustela-2en1-gel", variantSku: "MUS-2EN1-500", quantity: 1 },
      { productSlug: "liniment-oleocalcaire", quantity: 2 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 6,
  },
  {
    orderNumber: "JMS-2026-000011",
    customerEmail: "tarek.riahi@example.tn",
    shipping: {
      fullName: "Tarek Riahi",
      phone: "+216 96 224 117",
      street: "44 rue de Carthage",
      city: "Nabeul",
      postalCode: "8000",
      governorate: "Nabeul",
    },
    items: [
      { productSlug: "thermometre-frontal", quantity: 1 },
      { productSlug: "compresses-steriles", quantity: 3 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "shipped",
    daysAgo: 3,
  },
  {
    orderNumber: "JMS-2026-000012",
    guestEmail: "leila.guest@example.tn",
    guestPhone: "+216 24 778 119",
    shipping: {
      fullName: "Leila Hamdi",
      phone: "+216 24 778 119",
      street: "7 rue Sidi Bou Said",
      city: "Tunis",
      postalCode: "2026",
      governorate: "Tunis",
    },
    items: [
      { productSlug: "svr-sun-secure-spf50", variantSku: "SVR-SUN-CR-50", quantity: 1 },
      { productSlug: "vichy-capital-soleil", variantSku: "VIC-CAP-CR-50", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 12,
  },
  {
    orderNumber: "JMS-2026-000013",
    customerEmail: "salma.benali@example.tn",
    shipping: {
      fullName: "Salma Ben Ali",
      phone: "+216 22 110 220",
      street: "12 rue Ibn Khaldoun",
      city: "Nabeul",
      postalCode: "8000",
      governorate: "Nabeul",
    },
    items: [{ productSlug: "nuxe-reve-de-miel", quantity: 3 }],
    paymentMethod: "cash_on_delivery",
    status: "confirmed",
    daysAgo: 0,
  },
  {
    orderNumber: "JMS-2026-000014",
    customerEmail: "yasmine.bouzid@example.tn",
    shipping: {
      fullName: "Yasmine Bouzid",
      phone: "+216 24 556 178",
      street: "9 rue des Jasmins",
      city: "Sfax",
      postalCode: "3000",
      governorate: "Sfax",
    },
    items: [{ productSlug: "vichy-liftactiv-serum", quantity: 1 }],
    paymentMethod: "card_konnect",
    status: "cancelled",
    daysAgo: 16,
  },
  {
    orderNumber: "JMS-2026-000015",
    customerEmail: "imen.gharbi@example.tn",
    shipping: {
      fullName: "Imen Gharbi",
      phone: "+216 21 990 008",
      street: "22 rue de Mahdia",
      city: "Monastir",
      postalCode: "5000",
      governorate: "Monastir",
    },
    items: [
      { productSlug: "genouillere-ligamentaire", variantSku: "ORT-GEN-M", quantity: 1 },
      { productSlug: "chevillere-ajustable", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 4,
  },
  {
    orderNumber: "JMS-2026-000016",
    customerEmail: "mohamed.trabelsi@example.tn",
    shipping: {
      fullName: "Mohamed Trabelsi",
      phone: "+216 98 233 411",
      street: "45 av. de la Liberté",
      city: "Tunis",
      postalCode: "1002",
      governorate: "Tunis",
    },
    items: [{ productSlug: "bandelettes-accuchek", variantSku: "ACK-BD-100", quantity: 1 }],
    paymentMethod: "card_clic_to_pay",
    status: "delivered",
    daysAgo: 7,
  },
  {
    orderNumber: "JMS-2026-000017",
    customerEmail: "nour.bensalah@example.tn",
    shipping: {
      fullName: "Nour Ben Salah",
      phone: "+216 27 882 011",
      street: "5 rue de la Plage",
      city: "Nabeul",
      postalCode: "8000",
      governorate: "Nabeul",
    },
    items: [
      { productSlug: "avene-cleanance-gel", variantSku: "AVE-CLG-200", quantity: 1 },
      { productSlug: "avene-hydrance-creme", quantity: 1 },
    ],
    paymentMethod: "cash_on_delivery",
    status: "preparing",
    daysAgo: 1,
  },
  {
    orderNumber: "JMS-2026-000018",
    customerEmail: "ahmed.karoui@example.tn",
    shipping: {
      fullName: "Ahmed Karoui",
      phone: "+216 50 113 274",
      street: "11 rue Tanit",
      city: "Bizerte",
      postalCode: "7000",
      governorate: "Bizerte",
    },
    items: [{ productSlug: "tensio-omron-m7", quantity: 1 }],
    paymentMethod: "bank_transfer",
    status: "delivered",
    daysAgo: 19,
  },
  {
    orderNumber: "JMS-2026-000019",
    customerEmail: "tarek.riahi@example.tn",
    shipping: {
      fullName: "Tarek Riahi",
      phone: "+216 96 224 117",
      street: "44 rue de Carthage",
      city: "Nabeul",
      postalCode: "8000",
      governorate: "Nabeul",
    },
    items: [{ productSlug: "forte-pharma-energie", quantity: 2 }],
    paymentMethod: "cash_on_delivery",
    status: "delivered",
    daysAgo: 11,
  },
  {
    orderNumber: "JMS-2026-000020",
    customerEmail: "houda.mejri@example.tn",
    shipping: {
      fullName: "Houda Mejri",
      phone: "+216 28 114 887",
      street: "3 av. Mediterranée",
      city: "Hammamet",
      postalCode: "8050",
      governorate: "Nabeul",
    },
    items: [
      { productSlug: "bioderma-atoderm-creme", quantity: 1 },
      { productSlug: "mustela-hydra-bebe", quantity: 1 },
    ],
    paymentMethod: "card_konnect",
    status: "shipped",
    daysAgo: 2,
  },
];
