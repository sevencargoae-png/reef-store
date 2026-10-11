import { currentUser } from "@/lib/auth/session";
import { CartPage } from "@/components/store/cart-page";
export default async function Page() { return <CartPage loggedIn={!!(await currentUser())} />; }
