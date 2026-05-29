"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient, createSupabaseClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";
import type { Item, ItemVariant, ItemWithChoice } from "@/types";

// ============================================
// PUBLIC ACTIONS (Hala's side)
// ============================================

/** Fetch all items with their variants and choices */
export async function getItemsWithChoices(): Promise<ItemWithChoice[]> {
  const { data: items, error: itemsError } = await createSupabaseClient()
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  if (itemsError) throw new Error(itemsError.message);

  const { data: variants, error: variantsError } = await createSupabaseClient()
    .from("item_variants")
    .select("*")
    .order("sort_order", { ascending: true });

  if (variantsError) throw new Error(variantsError.message);

  const { data: choices, error: choicesError } = await createSupabaseClient()
    .from("choices")
    .select("*");

  if (choicesError) throw new Error(choicesError.message);

  return (items ?? []).map((item) => {
    const itemVariants = (variants ?? []).filter((v) => v.item_id === item.id);
    const itemChoices = (choices ?? []).filter((c) => c.item_id === item.id);
    return {
      ...item,
      variants: itemVariants,
      choices: itemChoices,
      // legacy single-choice field (used when no variants)
      choice: itemChoices.find((c) => c.variant_id === null) ?? null,
    };
  });
}

/**
 * Submit Hala's choice for an item or a specific variant.
 * - If variantId is provided → save/toggle that specific variant
 * - If no variantId → save for the whole item (no-variant path)
 */
export async function submitChoice(
  itemId: string,
  approved: boolean,
  variantId?: string | null
): Promise<void> {
  const { error } = await createSupabaseClient().from("choices").upsert(
    {
      item_id: itemId,
      variant_id: variantId ?? null,
      hala_approved: approved,
      chosen_at: new Date().toISOString(),
    },
    { onConflict: "item_id,variant_id" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
}

// ============================================
// ADMIN ACTIONS (protected)
// ============================================

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("Unauthorized");
}

/** Get all items (admin view, includes price + variants) */
export async function adminGetItems(): Promise<ItemWithChoice[]> {
  await requireAdmin();
  return getItemsWithChoices();
}

/** Create a new item (with optional variants) */
export async function adminCreateItem(
  data: Omit<Item, "id" | "created_at">,
  variantLabels?: string[]
): Promise<void> {
  await requireAdmin();
  const db = createServiceClient();
  const { data: inserted, error } = await db
    .from("items")
    .insert(data)
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (variantLabels && variantLabels.length > 0) {
    const rows = variantLabels
      .filter((l) => l.trim())
      .map((label, i) => ({
        item_id: inserted.id,
        label: label.trim(),
        sort_order: i,
      }));
    if (rows.length > 0) {
      const { error: vErr } = await db.from("item_variants").insert(rows);
      if (vErr) throw new Error(vErr.message);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

/** Update an existing item (and replace its variants) */
export async function adminUpdateItem(
  id: string,
  data: Partial<Omit<Item, "id" | "created_at">>,
  variantLabels?: string[]
): Promise<void> {
  await requireAdmin();
  const db = createServiceClient();

  const { error } = await db.from("items").update(data).eq("id", id);
  if (error) throw new Error(error.message);

  // If variantLabels is provided (even as empty array), replace all variants
  if (variantLabels !== undefined) {
    // Delete all existing variants for this item (cascade deletes related choices)
    await db.from("item_variants").delete().eq("item_id", id);

    const rows = variantLabels
      .filter((l) => l.trim())
      .map((label, i) => ({
        item_id: id,
        label: label.trim(),
        sort_order: i,
      }));
    if (rows.length > 0) {
      const { error: vErr } = await db.from("item_variants").insert(rows);
      if (vErr) throw new Error(vErr.message);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/");
}

/** Delete an item */
export async function adminDeleteItem(id: string): Promise<void> {
  await requireAdmin();
  const db = createServiceClient();
  const { error } = await db.from("items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/");
}

/** Upload an image and return its public URL */
export async function adminUploadImage(
  formData: FormData
): Promise<{ url: string }> {
  await requireAdmin();
  const db = createServiceClient();

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await db.storage
    .from("item-images")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data: urlData } = db.storage
    .from("item-images")
    .getPublicUrl(fileName);

  return { url: urlData.publicUrl };
}

/** Delete an image from storage */
export async function adminDeleteImage(url: string): Promise<void> {
  await requireAdmin();
  const db = createServiceClient();

  const parts = url.split("/item-images/");
  if (parts.length < 2) return;
  const filePath = parts[1];

  await db.storage.from("item-images").remove([filePath]);
}

/** Get all unique categories from items */
export async function getCategories(): Promise<string[]> {
  const { data } = await createSupabaseClient()
    .from("items")
    .select("category")
    .order("category");

  const cats = [...new Set((data ?? []).map((i) => i.category))];
  return cats;
}
