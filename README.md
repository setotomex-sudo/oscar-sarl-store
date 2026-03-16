## My Store - WhatsApp-based E‑commerce

This is a simple, mobile‑friendly e‑commerce storefront built with **Next.js (App Router)**, **Tailwind CSS**, and **Supabase**.

- **Public store** at `/` showing all products in a responsive grid.
- **Admin dashboard** at `/admin` protected by a simple password (`admin123`) for managing products.
- Product data is stored in **Supabase Postgres**, and images are stored in **Supabase Storage**.
- Each product card has a green **WhatsApp order** button that opens a prefilled chat.

---

### 1. Supabase setup

1. Create a new Supabase project.
2. In the **SQL editor**, create a `products` table:

```sql
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric,
  description text,
  image_url text,
  created_at timestamp with time zone default now()
);
```

3. Create a public storage bucket for product images named `product-images`.
4. In **Storage → Policies** for `product-images`, allow public read access for uploaded files.

If you want to keep things very simple, you can disable Row Level Security (RLS) on `products` or add policies that allow inserts/updates/deletes from the anon key (understanding that this is not production‑grade security).

---

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

You can find these in the Supabase dashboard under **Project Settings → API**.

Restart the dev server after changing env variables.

---

### 3. Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000` for the store and `http://localhost:3000/admin` for the admin dashboard.

---

### 4. Admin dashboard

- Navigate to `/admin`.
- Enter password: `admin123`.
- Use the form to **add**, **edit**, and **delete** products:
  - Name (required)
  - Price in DZD (optional; numeric)
  - Description (optional)
  - Image upload (optional; uploaded to `product-images` bucket)

Editing:
- Click an existing product card in the list to load it into the form.
- You can change the text and/or upload a new image.

Deleting:
- Click **Delete** on a product card, confirm the prompt, and it will be removed from Supabase.

Authentication is intentionally very simple (password stored in the frontend and persisted in `localStorage`) and is **not suitable for production**.

---

### 5. WhatsApp order button

On the public store (`/`), each product shows:

- Photo (if any)
- Name
- Price
- Description
- A green **“Order on WhatsApp”** button

The button opens:

```text
https://wa.me/213XXXXXXXXX?text=I want to order: [product name]
```

You should replace `213XXXXXXXXX` in `app/page.js` with your real WhatsApp number.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
