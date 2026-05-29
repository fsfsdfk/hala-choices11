import { isHalaAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getItemsWithChoices, getCategories } from "@/lib/actions";
import HalaGiftList from "@/components/hala/HalaGiftList";

export default async function HalaGiftsPage() {
  const hasPassword = !!process.env.HALA_PASSWORD;
  const authenticated = await isHalaAuthenticated();

  if (hasPassword && !authenticated) {
    redirect("/hala");
  }

  const [items, categories] = await Promise.all([
    getItemsWithChoices(),
    getCategories(),
  ]);

  return <HalaGiftList initialItems={items} categories={categories} />;
}
