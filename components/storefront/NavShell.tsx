"use client";

import { useState } from "react";
import { Nav } from "./Nav";
import { CartDrawer } from "./CartDrawer";
import type { CartDTO } from "@/server/types/cart";

export type NavUser = { name: string; email: string } | null;

/**
 * Client wrapper that holds the cart drawer's open/close state and bridges
 * the Nav cart trigger to the Sheet. Server layout passes the initial cart
 * DTO + user; mutations via server actions trigger revalidatePath which
 * re-renders this shell with fresh totals + session state.
 */
export function NavShell({ cart, user }: { cart: CartDTO; user: NavUser }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Nav cartCount={cart.itemCount} onOpenCart={() => setOpen(true)} user={user} />
      <CartDrawer cart={cart} open={open} onOpenChange={setOpen} />
    </>
  );
}
