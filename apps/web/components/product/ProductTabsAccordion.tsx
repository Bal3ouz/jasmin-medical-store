import { BodyText, H3Card } from "@jasmin/ui";

export function ProductTabsAccordion({
  description,
  ingredients,
  usage,
}: {
  description: string;
  ingredients?: string | null;
  usage?: string | null;
}) {
  return (
    <div className="space-y-8 border-t border-linen pt-12">
      <Section title="Description">
        <BodyText className="whitespace-pre-line">{description}</BodyText>
      </Section>
      {ingredients && (
        <Section title="Composition">
          <pre className="whitespace-pre-wrap rounded-md bg-linen/60 p-4 font-mono text-xs leading-[1.7] text-warm-taupe-soft">
            {ingredients}
          </pre>
        </Section>
      )}
      {usage && (
        <Section title="Mode d'emploi">
          <BodyText className="whitespace-pre-line">{usage}</BodyText>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <H3Card className="font-semibold">{title}</H3Card>
      <div className="mt-3">{children}</div>
    </section>
  );
}
