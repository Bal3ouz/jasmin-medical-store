import { Input } from "@jasmin/ui";

const GOVERNORATES = [
  "Ariana",
  "Béja",
  "Ben Arous",
  "Bizerte",
  "Gabès",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kébili",
  "Kef",
  "Mahdia",
  "Manouba",
  "Médenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
] as const;

export function ShippingAddressForm({ defaults }: { defaults?: Partial<Record<string, string>> }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Nom complet" name="fullName" defaultValue={defaults?.fullName} />
      <Field
        label="Téléphone"
        name="phone"
        type="tel"
        placeholder="+216 …"
        defaultValue={defaults?.phone}
      />
      <div className="sm:col-span-2">
        <Field label="Adresse" name="street" defaultValue={defaults?.street} />
      </div>
      <Field label="Ville" name="city" defaultValue={defaults?.city} />
      <Field label="Code postal" name="postalCode" defaultValue={defaults?.postalCode} />
      <div className="sm:col-span-2">
        <label className="block">
          <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
            Gouvernorat
          </span>
          <select
            name="governorate"
            required
            defaultValue={defaults?.governorate ?? "Nabeul"}
            className="h-11 w-full rounded-md bg-linen px-4 font-[var(--font-body)] text-base text-warm-taupe focus:outline-none focus:ring-2 focus:ring-deep-teal/40"
          >
            {GOVERNORATES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>
      <input type="hidden" name="country" value="TN" />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
        {label}
      </span>
      <Input
        name={name}
        type={type}
        required
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </label>
  );
}
