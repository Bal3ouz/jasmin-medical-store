import { BodyText, LabelEyebrow } from "@jasmin/ui";

export function CategoryHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="space-y-4">
      <LabelEyebrow>{eyebrow}</LabelEyebrow>
      <h1 className="font-[var(--font-display)] text-5xl italic text-deep-teal lg:text-6xl">
        {title}
      </h1>
      {description && <BodyText className="max-w-2xl">{description}</BodyText>}
    </header>
  );
}
