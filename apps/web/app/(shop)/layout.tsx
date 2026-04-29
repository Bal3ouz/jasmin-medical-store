import { CartDrawer } from "@/components/cart/CartDrawer";
import { Footer } from "@/components/layout/Footer";
import { TopNav } from "@/components/layout/TopNav";
import { getCart } from "@/lib/cart/server";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const cart = await getCart();
  return (
    <>
      <TopNav CartDrawerSlot={<CartDrawer cart={cart} />} />
      {children}
      <Footer />
    </>
  );
}
