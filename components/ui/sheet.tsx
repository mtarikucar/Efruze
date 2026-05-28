"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[80] bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300",
      "data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

type SheetSide = "left" | "right" | "top" | "bottom";

const sideClasses: Record<SheetSide, string> = {
  right:
    "right-0 top-0 h-full w-full max-w-md border-l border-line data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full",
  left:
    "left-0 top-0 h-full w-full max-w-md border-r border-line data-[state=open]:translate-x-0 data-[state=closed]:-translate-x-full",
  top:
    "left-0 top-0 w-full max-h-[85vh] border-b border-line data-[state=open]:translate-y-0 data-[state=closed]:-translate-y-full",
  bottom:
    "bottom-0 left-0 w-full max-h-[85vh] border-t border-line data-[state=open]:translate-y-0 data-[state=closed]:translate-y-full",
};

export const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: SheetSide;
    showClose?: boolean;
  }
>(({ className, side = "right", showClose = true, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-[90] bg-paper text-ink shadow-2xl outline-none",
        "transition-transform duration-400 ease-out",
        sideClasses[side],
        className,
      )}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 transition hover:bg-bg-deep hover:text-ink"
        >
          <X size={16} />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

export const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("font-serif text-2xl font-light tracking-tight text-ink", className)}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

export const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("font-serif text-base text-ink-2", className)}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";
