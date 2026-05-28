"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { retryPayTRTokenAction } from "@/app/(storefront)/checkout/paytr/[ref]/actions";

export function PayTRIframe({
  reference,
  token,
}: {
  reference: string;
  token: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function retry() {
    startTransition(async () => {
      await retryPayTRTokenAction({ reference });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <iframe
        src={`https://www.paytr.com/odeme/guest/${token}`}
        title="PayTR ödeme"
        className="block h-[760px] w-full rounded-sm card-elev"
        allowFullScreen
      />
      <div className="flex flex-wrap items-center justify-between gap-3 text-center sm:text-left">
        <p className="m-0 font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          İşlem referansı · {reference}
        </p>
        <button
          type="button"
          onClick={retry}
          disabled={pending}
          className="font-caps text-[10px] uppercase tracking-[0.22em] text-ink-mute underline-offset-4 transition hover:text-ink hover:underline disabled:opacity-50"
        >
          {pending ? "…" : "Oturumu yenile"}
        </button>
      </div>
    </div>
  );
}
