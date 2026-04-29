"use server";

export interface CartActionResult {
  ok: boolean;
  error?: string;
}

export async function addToCartAction(_formData: FormData): Promise<CartActionResult> {
  return { ok: false, error: "Cart non encore implémenté." };
}

export async function updateCartItemAction(_formData: FormData): Promise<CartActionResult> {
  return { ok: false, error: "Cart non encore implémenté." };
}

export async function removeCartItemAction(_formData: FormData): Promise<CartActionResult> {
  return { ok: false, error: "Cart non encore implémenté." };
}
