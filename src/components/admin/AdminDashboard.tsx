"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Heart,
  Plus,
  LogOut,
  LayoutGrid,
  List,
  Package,
  CheckCircle2,
  XCircle,
  Leaf,
  Pencil,
  Trash2,
  DollarSign,
  Eye,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import type { ItemWithChoice } from "@/types";
import { formatPrice } from "@/lib/utils";
import { adminDeleteItem, adminGetItems } from "@/lib/actions";
import AdminItemForm from "./AdminItemForm";
import AdminChatPanel from "./AdminChatPanel";
import { createSupabaseClient } from "@/lib/supabase";

interface Props {
  initialItems: ItemWithChoice[];
  categories: string[];
  logoutAction: () => Promise<void>;
}

/** How many "units" Hala has chosen for an item (1 per chosen variant, or 1 if item-level approved) */
function chosenUnits(item: ItemWithChoice): number {
  const allChoices = item.choices ?? [];
  const variantChosen = allChoices.filter((c) => c.variant_id !== null && c.hala_approved).length;
  if (variantChosen > 0) return variantChosen;
  return item.choice?.hala_approved ? 1 : 0;
}

/** Labels of chosen variants (or empty if no variants) */
function chosenVariantLabels(item: ItemWithChoice): string[] {
  const allChoices = item.choices ?? [];
  return allChoices
    .filter((c) => c.variant_id !== null && c.hala_approved)
    .map((c) => item.variants?.find((v) => v.id === c.variant_id)?.label ?? "")
    .filter(Boolean);
}

export default function AdminDashboard({
  initialItems,
  categories: initialCategories,
  logoutAction,
}: Props) {
  const [items, setItems] = useState<ItemWithChoice[]>(initialItems);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ItemWithChoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatUnread, setChatUnread] = useState(false);

  // Supabase client (created once on client side)
  const supabase = useMemo(() => createSupabaseClient(), []);

  // Derived stats
  const approved = useMemo(
    () => items.filter((i) => chosenUnits(i) > 0),
    [items]
  );
  const disapproved = useMemo(
    () =>
      items.filter(
        (i) =>
          chosenUnits(i) === 0 &&
          i.choice?.hala_approved === false &&
          i.choice !== null &&
          i.choice !== undefined
      ),
    [items]
  );
  const totalApprovedPrice = useMemo(
    () => approved.reduce((sum, i) => sum + (i.price || 0) * chosenUnits(i), 0),
    [approved]
  );
  const allCategories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category));
    initialCategories.forEach((c) => cats.add(c));
    return Array.from(cats);
  }, [items, initialCategories]);

  const refreshItems = useCallback(async () => {
    try {
      const fresh = await adminGetItems();
      setItems(fresh);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "choices" }, () => {
        refreshItems();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => {
        refreshItems();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "item_variants" }, () => {
        refreshItems();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const msg = payload.new as { sender: string };
        if (msg.sender === "hala" && !showChat) {
          setChatUnread(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshItems, supabase, showChat]);

  async function handleDelete(id: string) {
    try {
      await adminDeleteItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setDeleteConfirm(null);
    } catch (e) {
      console.error(e);
    }
  }

  function handleFormSuccess(newItems: ItemWithChoice[]) {
    setItems(newItems);
    setShowForm(false);
    setEditItem(null);
  }

  return (
    <div className="min-h-screen bg-admin flex flex-col">
      {/* Top navbar */}
      <header
        className="sticky top-0 z-40 px-6 py-4 flex items-center gap-4"
        style={{
          background: "rgba(255,255,255,0.90)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-rose-500" fill="currentColor" strokeWidth={0} />
          <span
            className="font-display text-xl font-semibold"
            style={{ fontFamily: "var(--font-cormorant)", color: "#be123c" }}
          >
            Hala&apos;s Choices — Admin
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <a
            href="/hala"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            style={{ fontFamily: "var(--font-jost)" }}
          >
            <Eye size={13} /> Preview Hala&apos;s view
          </a>
          <button
            onClick={() => { setShowChat(true); setChatUnread(false); }}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            style={{ fontFamily: "var(--font-jost)" }}
          >
            <MessageCircle size={13} /> Chat with Hala
            {chatUnread && (
              <span
                className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
                style={{ background: "#f43f5e" }}
              />
            )}
          </button>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition-colors"
              style={{ fontFamily: "var(--font-jost)" }}
            >
              <LogOut size={13} /> Logout
            </button>
          </form>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Package size={20} />} label="Total Items" value={items.length.toString()} color="blue" />
          <StatCard icon={<CheckCircle2 size={20} />} label="Hala Wants" value={approved.length.toString()} color="rose" />
          <StatCard icon={<XCircle size={20} />} label="Passed On" value={disapproved.length.toString()} color="gray" />
          <StatCard icon={<DollarSign size={20} />} label="Total Wishlist" value={formatPrice(totalApprovedPrice)} color="gold" />
        </div>

        {/* Approved items banner */}
        {approved.length > 0 && (
          <div
            className="mb-8 p-5 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(244,63,94,0.06), rgba(251,207,232,0.12))",
              border: "1px solid rgba(244,63,94,0.15)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Heart size={16} className="text-rose-500" fill="currentColor" strokeWidth={0} />
              <span className="font-medium text-rose-700 text-sm" style={{ fontFamily: "var(--font-jost)" }}>
                Hala&apos;s Approved Picks — {formatPrice(totalApprovedPrice)} total
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {approved.map((item) => {
                const labels = chosenVariantLabels(item);
                const units = chosenUnits(item);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col px-3 py-1.5 rounded-xl text-xs"
                    style={{
                      fontFamily: "var(--font-jost)",
                      background: "rgba(244,63,94,0.1)",
                      color: "#be123c",
                      border: "1px solid rgba(244,63,94,0.2)",
                    }}
                  >
                    <span className="font-medium">{item.name}</span>
                    {labels.length > 0 ? (
                      <span className="opacity-70 mt-0.5">
                        {labels.join(", ")} · {formatPrice(item.price * units)}
                      </span>
                    ) : (
                      <span className="opacity-60">· {formatPrice(item.price)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions row */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { setEditItem(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{
              fontFamily: "var(--font-jost)",
              background: "linear-gradient(135deg, #f43f5e, #be123c)",
              boxShadow: "0 4px 16px rgba(244,63,94,0.3)",
            }}
          >
            <Plus size={16} /> Add Item
          </button>

          <div className="ml-auto flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.05)" }}>
            <button
              onClick={() => setView("grid")}
              className="p-2 rounded-lg transition-all"
              style={{
                background: view === "grid" ? "white" : "transparent",
                color: view === "grid" ? "#be123c" : "#6b7280",
                boxShadow: view === "grid" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView("list")}
              className="p-2 rounded-lg transition-all"
              style={{
                background: view === "list" ? "white" : "transparent",
                color: view === "list" ? "#be123c" : "#6b7280",
                boxShadow: view === "list" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-400 text-lg" style={{ fontFamily: "var(--font-jost)" }}>
              No items yet. Add something beautiful for Hala!
            </p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <AdminItemCard
                key={item.id}
                item={item}
                onEdit={() => { setEditItem(item); setShowForm(true); }}
                onDelete={() => setDeleteConfirm(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <AdminItemRow
                key={item.id}
                item={item}
                onEdit={() => { setEditItem(item); setShowForm(true); }}
                onDelete={() => setDeleteConfirm(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Item form modal */}
      {showForm && (
        <AdminItemForm
          item={editItem}
          categories={allCategories}
          onSuccess={handleFormSuccess}
          onClose={() => { setShowForm(false); setEditItem(null); }}
        />
      )}

      {/* Chat panel */}
      {showChat && (
        <AdminChatPanel onClose={() => setShowChat(false)} />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: "var(--font-jost)" }}>
              Delete this item?
            </h3>
            <p className="text-gray-500 text-sm mb-5" style={{ fontFamily: "var(--font-jost)", fontWeight: 300 }}>
              This action cannot be undone. All variants and Hala&apos;s choices for this item will also be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-600"
                style={{ fontFamily: "var(--font-jost)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl text-sm bg-rose-500 text-white font-medium"
                style={{ fontFamily: "var(--font-jost)" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stat Card ──
function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "rose" | "gold" | "blue" | "gray";
}) {
  const colors = {
    rose: { bg: "rgba(244,63,94,0.08)", icon: "#f43f5e", text: "#be123c" },
    gold: { bg: "rgba(234,179,8,0.08)", icon: "#eab308", text: "#a16207" },
    blue: { bg: "rgba(59,130,246,0.08)", icon: "#3b82f6", text: "#1d4ed8" },
    gray: { bg: "rgba(0,0,0,0.04)", icon: "#6b7280", text: "#374151" },
  };
  const c = colors[color];
  return (
    <div
      className="p-4 rounded-2xl"
      style={{ background: "white", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: c.bg, color: c.icon }}>
        {icon}
      </div>
      <p className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: "var(--font-jost)" }}>{label}</p>
      <p className="font-semibold text-lg" style={{ fontFamily: "var(--font-jost)", color: c.text }}>{value}</p>
    </div>
  );
}

// ── Grid Card ──
function AdminItemCard({ item, onEdit, onDelete }: { item: ItemWithChoice; onEdit: () => void; onDelete: () => void }) {
  const units = chosenUnits(item);
  const labels = chosenVariantLabels(item);
  const approved = units > 0;
  const disapproved = item.choice !== null && item.choice !== undefined && item.choice?.hala_approved === false && units === 0;
  const hasVariants = item.variants && item.variants.length > 0;

  return (
    <div
      className="group rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {item.image_urls && item.image_urls.length > 0 ? (
          <Image
            src={item.image_urls[0]}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={28} className="text-gray-200" />
          </div>
        )}
        {approved ? (
          <div
            className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full text-white font-medium"
            style={{ fontFamily: "var(--font-jost)", background: "rgba(244,63,94,0.9)" }}
          >
            ❤️ {hasVariants && units > 1 ? `×${units}` : "Wants"}
          </div>
        ) : disapproved ? (
          <div
            className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full text-white font-medium"
            style={{ fontFamily: "var(--font-jost)", background: "rgba(0,0,0,0.5)" }}
          >
            ✗ Passed
          </div>
        ) : null}
      </div>

      <div className="p-3">
        <p className="font-medium text-sm text-gray-800 truncate mb-0.5" style={{ fontFamily: "var(--font-jost)" }}>
          {item.name}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-jost)", fontWeight: 300 }}>
            {item.category}
          </span>
          <span className="text-xs font-semibold text-rose-600" style={{ fontFamily: "var(--font-jost)" }}>
            {units > 1 ? `${formatPrice(item.price)} ×${units}` : formatPrice(item.price)}
          </span>
        </div>

        {/* Variant labels */}
        {labels.length > 0 && (
          <p className="text-xs text-rose-400 mt-1 truncate" style={{ fontFamily: "var(--font-jost)" }}>
            {labels.join(", ")}
          </p>
        )}
        {hasVariants && labels.length === 0 && (
          <p className="text-xs text-gray-300 mt-1" style={{ fontFamily: "var(--font-jost)" }}>
            {item.variants!.length} option{item.variants!.length !== 1 ? "s" : ""}
          </p>
        )}

        {item.healthy && (
          <div className="flex items-center gap-1 mt-1.5 text-green-600 text-xs" style={{ fontFamily: "var(--font-jost)" }}>
            <Leaf size={10} /> Healthy
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-blue-600 hover:bg-blue-50 transition-colors"
            style={{ fontFamily: "var(--font-jost)" }}
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-50 transition-colors"
            style={{ fontFamily: "var(--font-jost)" }}
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── List Row ──
function AdminItemRow({ item, onEdit, onDelete }: { item: ItemWithChoice; onEdit: () => void; onDelete: () => void }) {
  const units = chosenUnits(item);
  const labels = chosenVariantLabels(item);
  const approved = units > 0;
  const hasVariants = item.variants && item.variants.length > 0;

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl"
      style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
    >
      <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
        {item.image_urls && item.image_urls.length > 0 ? (
          <Image src={item.image_urls[0]} alt={item.name} fill className="object-cover" sizes="56px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={20} className="text-gray-200" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-800 truncate" style={{ fontFamily: "var(--font-jost)" }}>
          {item.name}
        </p>
        <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-jost)", fontWeight: 300 }}>
          {item.category} {item.healthy ? "· 🌿 Healthy" : ""}
          {hasVariants ? ` · ${item.variants!.length} options` : ""}
        </p>
        {labels.length > 0 && (
          <p className="text-xs text-rose-400 mt-0.5 truncate" style={{ fontFamily: "var(--font-jost)" }}>
            ❤️ {labels.join(", ")}
          </p>
        )}
      </div>

      <span className="text-sm font-semibold text-rose-600 flex-shrink-0" style={{ fontFamily: "var(--font-jost)" }}>
        {units > 1 ? `${formatPrice(item.price * units)} (×${units})` : formatPrice(item.price)}
      </span>

      <div className="flex-shrink-0">
        {approved ? (
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ fontFamily: "var(--font-jost)", background: "rgba(244,63,94,0.1)", color: "#be123c" }}
          >
            ❤️ Wants
          </span>
        ) : item.choice ? (
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ fontFamily: "var(--font-jost)", background: "rgba(0,0,0,0.06)", color: "#6b7280" }}
          >
            ✗ Passed
          </span>
        ) : (
          <span className="text-xs text-gray-300 px-2" style={{ fontFamily: "var(--font-jost)" }}>—</span>
        )}
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <button onClick={onEdit} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
