import { Prisma } from "@prisma/client";

/**
 * Soft-delete extension. Models declared in `softDeleteModels` have their
 * findMany / findFirst / findUnique queries auto-filtered to `deletedAt: null`.
 * Pass `where: { includeDeleted: true }` (and remove the flag in the wrapper)
 * to opt out — useful in admin contexts.
 *
 * Apply via: `prisma.$extends(softDeleteExtension)` in server/db/client.ts.
 */
const softDeleteModels = new Set<string>(["Product", "Category", "User"]);

export const softDeleteExtension = Prisma.defineExtension({
  name: "softDelete",
  query: {
    $allModels: {
      async findMany({ args, query, model }) {
        if (softDeleteModels.has(model)) {
          args.where = { ...(args.where ?? {}), deletedAt: null };
        }
        return query(args);
      },
      async findFirst({ args, query, model }) {
        if (softDeleteModels.has(model)) {
          args.where = { ...(args.where ?? {}), deletedAt: null };
        }
        return query(args);
      },
      async findUnique({ args, query, model }) {
        // findUnique can't have arbitrary `deletedAt` predicate — fall back to
        // findFirst behavior when the model is soft-deletable.
        if (softDeleteModels.has(model)) {
          // @ts-expect-error — narrowing to findFirst signature
          return query({ ...args, where: { ...(args.where ?? {}), deletedAt: null } });
        }
        return query(args);
      },
    },
  },
});
