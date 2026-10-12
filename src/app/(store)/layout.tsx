import { currentUser } from "@/lib/auth/session";
import { getCartDTO } from "@/lib/services/cart";
import { getSettings } from "@/lib/settings";
import { ToastProvider } from "@/components/ui/toast";
import { CartProvider } from "@/components/store/cart-provider";
import { BottomNav, Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { WishlistProvider } from "@/components/store/wish-button";
import { BackButton } from "@/components/store/back-button";
import { WhatsAppButton } from "@/components/store/whatsapp-button";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const user = await currentUser();
  const [cart, settings] = await Promise.all([getCartDTO(user), getSettings()]);
  return (
    <ToastProvider>
      <CartProvider initial={cart}><WishlistProvider loggedIn={!!user}>
        <div className="reef-backdrop min-h-dvh">
          <Header user={user} />
          <main className="mx-auto max-w-7xl px-4">{children}</main>
          <Footer supportPhone={settings.supportPhone} />
          <BackButton />
          <WhatsAppButton />
          <BottomNav user={user} />
        </div>
      </WishlistProvider></CartProvider>
    </ToastProvider>
  );
}
