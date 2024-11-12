"use server";
import { getQuery, param } from "@/util";

import { redirect } from "next/navigation";

export async function search(formData: FormData) {
  const value = getQuery(formData);

  if (value) {
    const searchParams = new URLSearchParams({ [param]: value });
    redirect(`/search?${searchParams.toString()}`);
  }
}
