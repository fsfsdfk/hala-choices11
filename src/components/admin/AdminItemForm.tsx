"use client";

import { useState, useRef } from "react";
import { X, Upload, Trash2, Plus, Loader2, GripVertical } from "lucide-react";
import Image from "next/image";
import type { ItemWithChoice } from "@/types";
import { DEFAULT_CATEGORIES } from "@/types";
import {
  adminCreateItem,
  adminUpdateItem,
  adminUploadImage,
  adminDeleteImage,
  adminGetItems,
} from "@/lib/actions";

interface Props {
  item: ItemWithChoice | null;
  categories: string[];
  onSuccess: (items: ItemWithChoice[]) => void;
  onClose: () => void;
}

export default function AdminItemForm({ item, categories, onSuccess, onClose }: Props) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item?.price?.toString() ?? "");
  const [category, setCategory] = useState(item?.category ?? "Other");
  const [customCategory, setCustomCategory] = useState("");
  const [healthy, setHealthy] = useState(item?.healthy ?? false);
  const [imageUrls, setImageUrls] = useState<string[]>(item?.image_urls ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Variants state — list of labels
  const [variants, setVariants] = useState<string[]>(
    item?.variants?.map((v) => v.label) ?? []
  );
  const [newVariant, setNewVariant] = useState("");

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]));

  function addVariant() {
    const label = newVariant.trim();
    if (!label) return;
    setVariants((prev) => [...prev, label]);
    setNewVariant("");
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, value: string) {
    setVariants((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const result = await adminUploadImage(fd);
        uploaded.push(result.url);
      }
      setImageUrls((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError("Image upload failed. Check your Supabase storage settings.");
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveImage(url: string) {
    setImageUrls((prev) => prev.filter((u) => u !== url));
    try {
      await adminDeleteImage(url);
    } catch {
      // non-critical
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const finalCategory = customCategory.trim() || category;
      const data = {
        name: name.trim(),
        description: description.trim() || null,
        price: parseFloat(price) || 0,
        category: finalCategory,
        healthy,
        image_urls: imageUrls,
      };

      if (item) {
        await adminUpdateItem(item.id, data, variants);
      } else {
        await adminCreateItem(data, variants);
      }

      const fresh = await adminGetItems();
      onSuccess(fresh);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-xl max-h-[95vh] overflow-y-auto animate-slide-up"
        style={{
          background: "white",
          borderRadius: "28px 28px 0 0",
          boxShadow: "0 -8px 60px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-6 pt-5 pb-4 flex items-center justify-between border-b border-gray-100 z-10">
          <h2 className="font-semibold text-gray-800 text-lg" style={{ fontFamily: "var(--font-jost)" }}>
            {item ? "Edit Item" : "Add New Item"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Name */}
          <Field label="Item Name *">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Gold Hoop Earrings"
              className="input-field"
            />
          </Field>

          {/* Price */}
          <Field label="Price *">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                className="input-field pl-8"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5" style={{ fontFamily: "var(--font-jost)" }}>
              If you add variants below, this price applies per variant chosen.
            </p>
          </Field>

          {/* Category */}
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
            >
              {allCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Or type a new category…"
              className="input-field mt-2"
            />
          </Field>

          {/* Description */}
          <Field label="Description / Comments">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add any notes or description here…"
              className="input-field resize-none"
            />
          </Field>

          {/* ── Variants ── */}
          <Field label="Options / Variants">
            <p className="text-xs text-gray-400 mb-2.5" style={{ fontFamily: "var(--font-jost)" }}>
              Add options Hala can choose from (e.g. colours, sizes). She can pick{" "}
              <strong className="text-rose-500">more than one</strong> — each picked option counts as a
              separate item at the price above.
            </p>

            {variants.length > 0 && (
              <div className="flex flex-col gap-2 mb-2">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
                    <input
                      value={v}
                      onChange={(e) => updateVariant(i, e.target.value)}
                      className="input-field flex-1"
                      placeholder={`Option ${i + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="p-2 rounded-lg hover:bg-rose-50 text-rose-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add variant row */}
            <div className="flex gap-2">
              <input
                value={newVariant}
                onChange={(e) => setNewVariant(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addVariant(); }
                }}
                placeholder="e.g. Black / Size M"
                className="input-field flex-1"
              />
              <button
                type="button"
                onClick={addVariant}
                disabled={!newVariant.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0"
                style={{
                  fontFamily: "var(--font-jost)",
                  background: newVariant.trim() ? "linear-gradient(135deg, #f43f5e, #be123c)" : "rgba(0,0,0,0.07)",
                  color: newVariant.trim() ? "white" : "#9ca3af",
                }}
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {variants.length === 0 && (
              <p className="text-xs text-gray-300 mt-1.5 italic" style={{ fontFamily: "var(--font-jost)" }}>
                No options yet — Hala will approve or skip the item as a whole.
              </p>
            )}
          </Field>

          {/* Healthy toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHealthy((v) => !v)}
              className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
              style={{
                background: healthy ? "#22c55e" : "#e5e7eb",
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                style={{ transform: healthy ? "translateX(24px)" : "translateX(0)" }}
              />
            </button>
            <span className="text-sm text-gray-600" style={{ fontFamily: "var(--font-jost)" }}>
              Mark as Healthy 🌿
            </span>
          </div>

          {/* Images */}
          <Field label="Photos">
            <div className="grid grid-cols-3 gap-2 mb-2">
              {imageUrls.map((url) => (
                <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 group">
                  <Image src={url} alt="" fill className="object-cover" sizes="120px" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(url)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                  >
                    <Trash2 size={18} className="text-white" />
                  </button>
                </div>
              ))}

              {/* Upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-xs transition-colors"
                style={{
                  borderColor: "rgba(244,63,94,0.3)",
                  color: "#f43f5e",
                  background: "rgba(244,63,94,0.03)",
                }}
              >
                {uploading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <Upload size={20} />
                    <span style={{ fontFamily: "var(--font-jost)" }}>Upload</span>
                  </>
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </Field>

          {error && (
            <p className="text-rose-500 text-sm" style={{ fontFamily: "var(--font-jost)" }}>
              ⚠️ {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-medium transition-all mb-2"
            style={{
              fontFamily: "var(--font-jost)",
              background: saving || uploading
                ? "rgba(244,63,94,0.5)"
                : "linear-gradient(135deg, #f43f5e, #be123c)",
              boxShadow: saving ? "none" : "0 4px 20px rgba(244,63,94,0.3)",
            }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Plus size={16} /> {item ? "Save Changes" : "Add Item"}
              </>
            )}
          </button>
        </form>
      </div>

      <style jsx global>{`
        .input-field {
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1.5px solid rgba(0, 0, 0, 0.1);
          font-size: 0.875rem;
          font-family: var(--font-jost);
          outline: none;
          background: #fafafa;
          color: #1f2937;
          transition: border-color 0.15s;
        }
        .input-field:focus {
          border-color: #f43f5e;
          box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.08);
          background: white;
        }
        select.input-field {
          appearance: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider"
        style={{ fontFamily: "var(--font-jost)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
