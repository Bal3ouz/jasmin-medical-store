/**
 * Extended demo customer seed for Jasmin Médical Store.
 *
 * 25 customers with realistic Tunisian names, phone numbers (carrier-valid prefixes),
 * and addresses spread across 8 governorates with a Nabeul-heavy distribution
 * (the shop is located in Nabeul).
 *
 * The integrator will:
 *   - Insert customers via `customers` table (using these UUIDs).
 *   - Insert addresses via `customer_addresses` (customer_id resolved by email).
 *   - Set customers.default_shipping_address_id from the address marked isDefault.
 */

export interface ExtendedSeedCustomer {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  /** ISO date string (YYYY-MM-DD) or null. */
  dateOfBirth: string | null;
  marketingConsent: boolean;
  newsletterSubscribed: boolean;
}

export interface ExtendedSeedAddress {
  /** Optional pinned address UUID (we use the `a0000000-...` namespace). */
  id: string;
  customerEmail: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  governorate: string;
  country: string;
  isDefault: boolean;
}

// ---------------------------------------------------------------------------
// Customers — 25 entries
// ---------------------------------------------------------------------------

export const EXTENDED_CUSTOMER_SEED: ExtendedSeedCustomer[] = [
  // ---- Nabeul × 8 ----------------------------------------------------------
  {
    id: "c0000000-0000-4000-8000-000000000001",
    email: "mehdi.bouzguenda@gmail.com",
    fullName: "Mehdi Bouzguenda",
    phone: "+216 22 412 087",
    dateOfBirth: "1984-06-12",
    marketingConsent: true,
    newsletterSubscribed: true,
  },
  {
    id: "c0000000-0000-4000-8000-000000000002",
    email: "amina.sassi@yahoo.fr",
    fullName: "Amina Sassi",
    phone: "+216 25 778 340",
    dateOfBirth: "1991-03-28",
    marketingConsent: true,
    newsletterSubscribed: false,
  },
  {
    id: "c0000000-0000-4000-8000-000000000003",
    email: "hassen.oueslati@topnet.tn",
    fullName: "Hassen Oueslati",
    phone: "+216 98 134 552",
    dateOfBirth: null,
    marketingConsent: false,
    newsletterSubscribed: false,
  },
  {
    id: "c0000000-0000-4000-8000-000000000004",
    email: "rim.jebali@gmail.com",
    fullName: "Rim Jebali",
    phone: "+216 27 904 116",
    dateOfBirth: "1996-11-04",
    marketingConsent: true,
    newsletterSubscribed: true,
  },
  {
    id: "c0000000-0000-4000-8000-000000000005",
    email: "walid.bouaziz@hotmail.com",
    fullName: "Walid Bouaziz",
    phone: "+216 50 332 770",
    dateOfBirth: null,
    marketingConsent: true,
    newsletterSubscribed: false,
  },
  {
    id: "c0000000-0000-4000-8000-000000000006",
    email: "sonia.mejri@planet.tn",
    fullName: "Sonia Mejri",
    phone: "+216 96 217 044",
    dateOfBirth: "1978-09-19",
    marketingConsent: false,
    newsletterSubscribed: true,
  },
  {
    id: "c0000000-0000-4000-8000-000000000007",
    email: "nizar.hammami@gmail.com",
    fullName: "Nizar Hammami",
    phone: "+216 21 658 932",
    dateOfBirth: "1987-01-23",
    marketingConsent: true,
    newsletterSubscribed: false,
  },
  {
    id: "c0000000-0000-4000-8000-000000000008",
    email: "ines.chouchene@yahoo.fr",
    fullName: "Inès Chouchène",
    phone: "+216 24 880 451",
    dateOfBirth: null,
    marketingConsent: true,
    newsletterSubscribed: true,
  },

  // ---- Tunis × 5 -----------------------------------------------------------
  {
    id: "c0000000-0000-4000-8000-000000000009",
    email: "mohamed.benali@gmail.com",
    fullName: "Mohamed Ben Ali",
    phone: "+216 99 540 218",
    dateOfBirth: "1972-04-08",
    marketingConsent: false,
    newsletterSubscribed: false,
  },
  {
    id: "c0000000-0000-4000-8000-00000000000a",
    email: "fatma.trabelsi@hotmail.com",
    fullName: "Fatma Trabelsi",
    phone: "+216 28 305 661",
    dateOfBirth: "1989-12-15",
    marketingConsent: true,
    newsletterSubscribed: true,
  },
  {
    id: "c0000000-0000-4000-8000-00000000000b",
    email: "karim.zouari@topnet.tn",
    fullName: "Karim Zouari",
    phone: "+216 92 117 884",
    dateOfBirth: null,
    marketingConsent: true,
    newsletterSubscribed: false,
  },
  {
    id: "c0000000-0000-4000-8000-00000000000c",
    email: "leila.hamdi@gmail.com",
    fullName: "Leila Hamdi",
    phone: "+216 23 446 902",
    dateOfBirth: "1995-07-30",
    marketingConsent: true,
    newsletterSubscribed: true,
  },
  {
    id: "c0000000-0000-4000-8000-00000000000d",
    email: "ahmed.khelifi@yahoo.fr",
    fullName: "Ahmed Khelifi",
    phone: "+216 55 627 134",
    dateOfBirth: null,
    marketingConsent: false,
    newsletterSubscribed: false,
  },

  // ---- Sousse × 3 ----------------------------------------------------------
  {
    id: "c0000000-0000-4000-8000-00000000000e",
    email: "yasmine.bensaid@gmail.com",
    fullName: "Yasmine Ben Said",
    phone: "+216 26 158 740",
    dateOfBirth: "1993-02-17",
    marketingConsent: true,
    newsletterSubscribed: true,
  },
  {
    id: "c0000000-0000-4000-8000-00000000000f",
    email: "omar.bouaziz@planet.tn",
    fullName: "Omar Bouaziz",
    phone: "+216 51 920 388",
    dateOfBirth: "1981-05-22",
    marketingConsent: false,
    newsletterSubscribed: false,
  },
  {
    id: "c0000000-0000-4000-8000-000000000010",
    email: "salma.bouzid@hotmail.com",
    fullName: "Salma Bouzid",
    phone: "+216 97 343 015",
    dateOfBirth: null,
    marketingConsent: true,
    newsletterSubscribed: false,
  },

  // ---- Sfax × 3 ------------------------------------------------------------
  {
    id: "c0000000-0000-4000-8000-000000000011",
    email: "youssef.mansouri@gmail.com",
    fullName: "Youssef Mansouri",
    phone: "+216 29 074 218",
    dateOfBirth: "1969-08-03",
    marketingConsent: false,
    newsletterSubscribed: true,
  },
  {
    id: "c0000000-0000-4000-8000-000000000012",
    email: "asma.feki@yahoo.fr",
    fullName: "Asma Feki",
    phone: "+216 53 781 220",
    dateOfBirth: "2001-10-25",
    marketingConsent: true,
    newsletterSubscribed: true,
  },
  {
    id: "c0000000-0000-4000-8000-000000000013",
    email: "bilel.gargouri@topnet.tn",
    fullName: "Bilel Gargouri",
    phone: "+216 90 414 657",
    dateOfBirth: null,
    marketingConsent: true,
    newsletterSubscribed: false,
  },

  // ---- Bizerte × 2 ---------------------------------------------------------
  {
    id: "c0000000-0000-4000-8000-000000000014",
    email: "khaled.belhaj@gmail.com",
    fullName: "Khaled Belhaj",
    phone: "+216 54 211 866",
    dateOfBirth: "1976-12-01",
    marketingConsent: true,
    newsletterSubscribed: false,
  },
  {
    id: "c0000000-0000-4000-8000-000000000015",
    email: "hela.zribi@hotmail.com",
    fullName: "Hela Zribi",
    phone: "+216 22 988 405",
    dateOfBirth: null,
    marketingConsent: false,
    newsletterSubscribed: true,
  },

  // ---- Monastir × 2 --------------------------------------------------------
  {
    id: "c0000000-0000-4000-8000-000000000016",
    email: "skander.naffeti@gmail.com",
    fullName: "Skander Naffeti",
    phone: "+216 26 553 712",
    dateOfBirth: "1985-04-14",
    marketingConsent: true,
    newsletterSubscribed: true,
  },
  {
    id: "c0000000-0000-4000-8000-000000000017",
    email: "mariem.ayari@planet.tn",
    fullName: "Mariem Ayari",
    phone: "+216 95 174 309",
    dateOfBirth: "1998-06-08",
    marketingConsent: true,
    newsletterSubscribed: false,
  },

  // ---- Kairouan × 1 --------------------------------------------------------
  {
    id: "c0000000-0000-4000-8000-000000000018",
    email: "anouar.dridi@gmail.com",
    fullName: "Anouar Dridi",
    phone: "+216 20 366 951",
    dateOfBirth: "1965-11-27",
    marketingConsent: false,
    newsletterSubscribed: false,
  },

  // ---- Mahdia × 1 ----------------------------------------------------------
  {
    id: "c0000000-0000-4000-8000-000000000019",
    email: "syrine.cherni@yahoo.fr",
    fullName: "Syrine Cherni",
    phone: "+216 52 740 188",
    dateOfBirth: "1992-09-09",
    marketingConsent: true,
    newsletterSubscribed: true,
  },
];

// ---------------------------------------------------------------------------
// Addresses — one default per customer
// ---------------------------------------------------------------------------

export const EXTENDED_ADDRESS_SEED: ExtendedSeedAddress[] = [
  // Nabeul governorate
  {
    id: "a0000000-0000-4000-8000-000000000101",
    customerEmail: "mehdi.bouzguenda@gmail.com",
    fullName: "Mehdi Bouzguenda",
    phone: "+216 22 412 087",
    street: "27 Avenue Habib Bourguiba",
    city: "Nabeul",
    postalCode: "8000",
    governorate: "Nabeul",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-000000000102",
    customerEmail: "amina.sassi@yahoo.fr",
    fullName: "Amina Sassi",
    phone: "+216 25 778 340",
    street: "14 Rue Ibn Khaldoun",
    city: "Nabeul",
    postalCode: "8000",
    governorate: "Nabeul",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-000000000103",
    customerEmail: "hassen.oueslati@topnet.tn",
    fullName: "Hassen Oueslati",
    phone: "+216 98 134 552",
    street: "9 Cité El Arbaa",
    city: "Hammamet",
    postalCode: "8050",
    governorate: "Nabeul",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-000000000104",
    customerEmail: "rim.jebali@gmail.com",
    fullName: "Rim Jebali",
    phone: "+216 27 904 116",
    street: "31 Avenue de la République",
    city: "Hammamet",
    postalCode: "8050",
    governorate: "Nabeul",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-000000000105",
    customerEmail: "walid.bouaziz@hotmail.com",
    fullName: "Walid Bouaziz",
    phone: "+216 50 332 770",
    street: "6 Rue de la Plage",
    city: "Kelibia",
    postalCode: "8090",
    governorate: "Nabeul",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-000000000106",
    customerEmail: "sonia.mejri@planet.tn",
    fullName: "Sonia Mejri",
    phone: "+216 96 217 044",
    street: "18 Rue Hedi Chaker",
    city: "Korba",
    postalCode: "8070",
    governorate: "Nabeul",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-000000000107",
    customerEmail: "nizar.hammami@gmail.com",
    fullName: "Nizar Hammami",
    phone: "+216 21 658 932",
    street: "44 Avenue Farhat Hached",
    city: "Nabeul",
    postalCode: "8000",
    governorate: "Nabeul",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-000000000108",
    customerEmail: "ines.chouchene@yahoo.fr",
    fullName: "Inès Chouchène",
    phone: "+216 24 880 451",
    street: "12 Rue des Orangers",
    city: "Nabeul",
    postalCode: "8000",
    governorate: "Nabeul",
    country: "TN",
    isDefault: true,
  },

  // Tunis governorate
  {
    id: "a0000000-0000-4000-8000-000000000109",
    customerEmail: "mohamed.benali@gmail.com",
    fullName: "Mohamed Ben Ali",
    phone: "+216 99 540 218",
    street: "62 Avenue Habib Bourguiba",
    city: "Tunis",
    postalCode: "1000",
    governorate: "Tunis",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-00000000010a",
    customerEmail: "fatma.trabelsi@hotmail.com",
    fullName: "Fatma Trabelsi",
    phone: "+216 28 305 661",
    street: "8 Rue de Marseille",
    city: "Tunis",
    postalCode: "1001",
    governorate: "Tunis",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-00000000010b",
    customerEmail: "karim.zouari@topnet.tn",
    fullName: "Karim Zouari",
    phone: "+216 92 117 884",
    street: "23 Rue d'Alger",
    city: "Le Bardo",
    postalCode: "2000",
    governorate: "Tunis",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-00000000010c",
    customerEmail: "leila.hamdi@gmail.com",
    fullName: "Leila Hamdi",
    phone: "+216 23 446 902",
    street: "5 Rue Sidi Bou Said",
    city: "La Marsa",
    postalCode: "2078",
    governorate: "Tunis",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-00000000010d",
    customerEmail: "ahmed.khelifi@yahoo.fr",
    fullName: "Ahmed Khelifi",
    phone: "+216 55 627 134",
    street: "17 Avenue de Carthage",
    city: "Tunis",
    postalCode: "1002",
    governorate: "Tunis",
    country: "TN",
    isDefault: true,
  },

  // Sousse governorate
  {
    id: "a0000000-0000-4000-8000-00000000010e",
    customerEmail: "yasmine.bensaid@gmail.com",
    fullName: "Yasmine Ben Said",
    phone: "+216 26 158 740",
    street: "11 Avenue Habib Bourguiba",
    city: "Sousse",
    postalCode: "4000",
    governorate: "Sousse",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-00000000010f",
    customerEmail: "omar.bouaziz@planet.tn",
    fullName: "Omar Bouaziz",
    phone: "+216 51 920 388",
    street: "33 Rue de la Liberté",
    city: "Hammam Sousse",
    postalCode: "4011",
    governorate: "Sousse",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-000000000110",
    customerEmail: "salma.bouzid@hotmail.com",
    fullName: "Salma Bouzid",
    phone: "+216 97 343 015",
    street: "7 Rue Ibn Sina",
    city: "Msaken",
    postalCode: "4070",
    governorate: "Sousse",
    country: "TN",
    isDefault: true,
  },

  // Sfax governorate
  {
    id: "a0000000-0000-4000-8000-000000000111",
    customerEmail: "youssef.mansouri@gmail.com",
    fullName: "Youssef Mansouri",
    phone: "+216 29 074 218",
    street: "29 Avenue de la Liberté",
    city: "Sfax",
    postalCode: "3000",
    governorate: "Sfax",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-000000000112",
    customerEmail: "asma.feki@yahoo.fr",
    fullName: "Asma Feki",
    phone: "+216 53 781 220",
    street: "4 Rue Ibn Khaldoun",
    city: "Sfax",
    postalCode: "3000",
    governorate: "Sfax",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-000000000113",
    customerEmail: "bilel.gargouri@topnet.tn",
    fullName: "Bilel Gargouri",
    phone: "+216 90 414 657",
    street: "21 Avenue Hedi Chaker",
    city: "Sakiet Ezzit",
    postalCode: "3021",
    governorate: "Sfax",
    country: "TN",
    isDefault: true,
  },

  // Bizerte governorate
  {
    id: "a0000000-0000-4000-8000-000000000114",
    customerEmail: "khaled.belhaj@gmail.com",
    fullName: "Khaled Belhaj",
    phone: "+216 54 211 866",
    street: "16 Rue de la République",
    city: "Bizerte",
    postalCode: "7000",
    governorate: "Bizerte",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-000000000115",
    customerEmail: "hela.zribi@hotmail.com",
    fullName: "Hela Zribi",
    phone: "+216 22 988 405",
    street: "3 Avenue Tahar Sfar",
    city: "Menzel Bourguiba",
    postalCode: "7050",
    governorate: "Bizerte",
    country: "TN",
    isDefault: true,
  },

  // Monastir governorate
  {
    id: "a0000000-0000-4000-8000-000000000116",
    customerEmail: "skander.naffeti@gmail.com",
    fullName: "Skander Naffeti",
    phone: "+216 26 553 712",
    street: "10 Avenue Habib Bourguiba",
    city: "Monastir",
    postalCode: "5000",
    governorate: "Monastir",
    country: "TN",
    isDefault: true,
  },
  {
    id: "a0000000-0000-4000-8000-000000000117",
    customerEmail: "mariem.ayari@planet.tn",
    fullName: "Mariem Ayari",
    phone: "+216 95 174 309",
    street: "25 Rue de l'Indépendance",
    city: "Ksar Hellal",
    postalCode: "5070",
    governorate: "Monastir",
    country: "TN",
    isDefault: true,
  },

  // Kairouan governorate
  {
    id: "a0000000-0000-4000-8000-000000000118",
    customerEmail: "anouar.dridi@gmail.com",
    fullName: "Anouar Dridi",
    phone: "+216 20 366 951",
    street: "8 Avenue de la République",
    city: "Kairouan",
    postalCode: "3100",
    governorate: "Kairouan",
    country: "TN",
    isDefault: true,
  },

  // Mahdia governorate
  {
    id: "a0000000-0000-4000-8000-000000000119",
    customerEmail: "syrine.cherni@yahoo.fr",
    fullName: "Syrine Cherni",
    phone: "+216 52 740 188",
    street: "13 Rue du Borj",
    city: "Mahdia",
    postalCode: "5100",
    governorate: "Mahdia",
    country: "TN",
    isDefault: true,
  },
];
