# 💕 Hala's Choices

> A private, romantic gift-picker app built with love — just for Hala.

A beautiful two-sided web app: you (admin) curate a wishlist of gifts, and Hala (client) picks what she loves — without ever seeing prices.

---

## ✨ Features

### Hala's Side
- 🌸 Romantic welcome screen with her name and soft animations
- 💝 Beautiful gift grid with photos, categories, and filters
- ❤️ Approve/Disapprove each item with a flirty message on approval
- 🌿 Healthy-only filter
- 📱 Fully mobile-first, gorgeous on her phone

### Admin Side
- 🔐 Password-protected dashboard
- ➕ Full CRUD for items (name, price, description, category, photos, healthy flag)
- 📸 Multi-photo upload per item via Supabase Storage
- 💰 Real-time total of everything Hala approved
- 📊 Live dashboard with stats
- 🔄 Realtime sync — see Hala's choices the moment she makes them

---

## 🛠 Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** with custom romantic design tokens
- **Supabase** (PostgreSQL + Storage + Realtime + Row Level Security)
- **Server Actions** + React Server Components
- **Framer Motion** animations

---

## 🚀 Deployment

### Step 1: Set up Supabase

1. Go to [app.supabase.com](https://app.supabase.com) and create a new project.
2. Once the project is ready, open **SQL Editor** and run the full migration:
   ```
   supabase/migrations/001_initial.sql
   ```
   This creates the `items` and `choices` tables, RLS policies, storage bucket, and realtime.

3. From **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(keep this secret!)*

### Step 2: Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
3. In **Environment Variables**, add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `ADMIN_PASSWORD` | Your chosen admin password |
| `HALA_PASSWORD` | *(optional)* A password for Hala's side |

4. Click **Deploy**. Done! 🎉

---

## 🏃 Local Development

```bash
# 1. Clone & install
npm install

# 2. Copy env file
cp .env.example .env.local
# Fill in all the values in .env.local

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Redirects to /hala
│   ├── hala/
│   │   ├── page.tsx            # Welcome screen
│   │   └── gifts/page.tsx      # Gift list
│   └── admin/
│       ├── page.tsx            # Admin login
│       └── dashboard/page.tsx  # Admin dashboard
├── components/
│   ├── hala/
│   │   ├── HalaWelcome.tsx     # ✨ Romantic landing screen
│   │   ├── HalaGiftList.tsx    # Grid of gifts with filters
│   │   ├── HalaItemModal.tsx   # Full-screen item detail + approve
│   │   └── HalaPasswordGate.tsx
│   └── admin/
│       ├── AdminLogin.tsx
│       ├── AdminDashboard.tsx  # Stats + item management
│       └── AdminItemForm.tsx   # Create/edit item form
├── lib/
│   ├── supabase.ts             # Supabase client setup
│   ├── auth.ts                 # Cookie-based auth helpers
│   ├── auth-actions.ts         # Login/logout server actions
│   ├── actions.ts              # All data server actions
│   └── utils.ts                # cn(), formatPrice()
└── types/
    └── index.ts                # Shared types + FLIRTY_MESSAGES array
```

---

## 💌 Customizing the Flirty Messages

Open `src/types/index.ts` and edit the `FLIRTY_MESSAGES` array — that's all you need to do:

```ts
export const FLIRTY_MESSAGES: string[] = [
  "You have no idea how happy this makes me… 😍",
  "My beautiful girl knows exactly what she deserves ❤️",
  // Add your own here!
  "I can't wait to see you smile when you get this 🥹",
];
```

---

## 🔑 Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Redirects to `/hala` |
| `/hala` | Public (or password) | Hala's welcome screen |
| `/hala/gifts` | Public (or password) | Hala's gift list |
| `/admin` | Admin only | Admin login |
| `/admin/dashboard` | Admin only | Full dashboard |

---

## 🌹 Made with love

Built with care, for Hala. May she love every single item. ❤️
