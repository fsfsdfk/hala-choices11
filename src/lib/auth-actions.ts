"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, HALA_COOKIE } from "@/lib/auth";

export async function adminLogin(formData: FormData): Promise<{ error?: string }> {
  const password = formData.get("password") as string;

  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: "Wrong password, darling." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  redirect("/admin/dashboard");
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin");
}

export async function halaLogin(formData: FormData): Promise<{ error?: string }> {
  const password = formData.get("password") as string;

  if (password !== process.env.HALA_PASSWORD) {
    return { error: "Try again, beautiful 💕" };
  }

  const cookieStore = await cookies();
  cookieStore.set(HALA_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  redirect("/hala");
}
