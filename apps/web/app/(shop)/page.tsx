import { BrandMarqueeStrip } from "@/components/landing/BrandMarqueeStrip";
import { CategoryShowcase } from "@/components/landing/CategoryShowcase";
import { EditorialQuote } from "@/components/landing/EditorialQuote";
import { PromoStrip } from "@/components/landing/PromoStrip";
import { SensorialMoment } from "@/components/landing/SensorialMoment";
import { TealHeroPanel } from "@jasmin/ui";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const LandingHeroAnimated = dynamic(
  () => import("@/components/landing/LandingHeroAnimated").then((m) => m.LandingHeroAnimated),
  {
    ssr: true,
    loading: () => <TealHeroPanel className="min-h-[88vh]" aria-hidden />,
  },
);

export const revalidate = 60;

export default function HomePage() {
  return (
    <main>
      <LandingHeroAnimated />
      <BrandMarqueeStrip />
      <Suspense fallback={null}>
        <PromoStrip />
      </Suspense>
      <Suspense fallback={null}>
        <CategoryShowcase />
      </Suspense>
      <SensorialMoment />
      <EditorialQuote />
    </main>
  );
}
