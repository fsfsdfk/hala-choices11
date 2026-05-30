// ============================================
// Hala's Choices — Shared TypeScript Types
// ============================================

export interface ItemVariant {
  id: string;
  item_id: string;
  label: string;
  sort_order: number;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  healthy: boolean;
  image_urls: string[];
  created_at: string;
}

export interface Choice {
  id: string;
  item_id: string;
  variant_id: string | null;
  hala_approved: boolean;
  chosen_at: string;
}

export interface ItemReaction {
  id: string;
  item_id: string;
  emoji: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemWithChoice extends Item {
  variants?: ItemVariant[];
  /** All choices for this item (one per variant, or one total if no variants) */
  choices?: Choice[];
  /** Legacy single-choice field (kept for backward compat with no-variant items) */
  choice?: Choice | null;
  /** Hala's emoji reaction + note on this item */
  reaction?: ItemReaction | null;
}

export type Category =
  | "Jewelry"
  | "Clothes"
  | "Lingerie"
  | "Shoes"
  | "Tech"
  | "Home"
  | "Food"
  | "Beauty"
  | "Accessories"
  | "Other";

export const DEFAULT_CATEGORIES: string[] = [
  "Jewelry",
  "Clothes",
  "Lingerie",
  "Shoes",
  "Tech",
  "Home",
  "Food",
  "Beauty",
  "Accessories",
  "Other",
];

// ============================================
// Flirty messages shown when Hala approves
// ============================================
export const FLIRTY_MESSAGES: string[] = [
  "You have no idea how happy I am to know you 😍",
  "The baddie of my heart 😍",
  "The spicy Blondish Latina 😍",
  "My beautiful girl knows exactly what she deserves ❤️",
  "I am sure you gonna love this one babe 💕",
  "Approved by the love of my life ✅",
  "Adding this to the 'spoil Hala' list 😉",
  "May you find a place in your heart for me ❤️",
  "Perfect choice for my perfect girl",
  "The way you pick things ... it's so YOU 💕",
  "Nothing is too good for my queen 👑",
  "You deserve every single thing you want",
  "My heart literally skipped a beat ✨",
  "Already can't wait to see you 🥰",
  "You have the BEST taste, habibi",
  "A happy ending for me is an ending with you ❤️",
  "Your place is in my heart sweetie ❤️",
  "Can you stop being so perfect ?",
  "Noted. Wrapped. Delivered with love 🎁",
];

export function getRandomFlirtyMessage(): string {
  return FLIRTY_MESSAGES[Math.floor(Math.random() * FLIRTY_MESSAGES.length)];
}

// ============================================
// Chat
// ============================================
export interface ChatMessage {
  id: string;
  sender: "admin" | "hala";
  content: string;
  reactions: Record<string, string[]>; // { "💕": ["hala", "admin"] }
  created_at: string;
}

// ============================================
// Filter states
// ============================================
export type LikeFilter = "all" | "liked" | "disliked" | "unchosen";

// ============================================
// Emoji sets
// ============================================
export const CHAT_EMOJIS = ["💕", "😍", "🥺", "😂", "❤️", "🔥", "😘", "🥰"];
export const ITEM_EMOJIS  = ["💕", "😍", "🔥", "✨", "🥺", "💸", "🤩", "💎"];
