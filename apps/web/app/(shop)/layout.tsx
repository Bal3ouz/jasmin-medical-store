import { Footer } from "@/components/layout/Footer";
import { TopNav } from "@/components/layout/TopNav";
import { getCartCount } from "@/lib/cart/server";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const cartCount = await getCartCount();
  return (
    <>
      <TopNav cartCount={cartCount} />
      {children}
      <Footer />
    </>
  );
}
