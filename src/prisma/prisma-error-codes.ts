export const prismaErrorCodes = {
    resultNotFound: "P2025",
    uniqueConstraintViolation: "P2002",
};

type PrismaUniqueConstraintMeta = {
    // Keep this type conservative and revisit on Prisma upgrades.
    // The P2002 metadata shape has been unstable in practice (see prisma/prisma#28281),
    // so fields may move between `meta.target` and nested adapter-specific paths.
    target?: unknown;
    driverAdapterError?: {
        cause?: {
            constraint?: {
                fields?: unknown;
            };
        };
    };
};

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === "string");

/**
 * Prisma changed error metadata shape when using driver adapters.
 * Support both legacy `meta.target` and adapter `meta.driverAdapterError.cause.constraint.fields`.
 */
export const getUniqueConstraintFields = (meta: unknown): string[] => {
    if (!meta || typeof meta !== "object") return [];

    const typedMeta = meta as PrismaUniqueConstraintMeta;

    if (isStringArray(typedMeta.target)) return typedMeta.target;

    const adapterFields = typedMeta.driverAdapterError?.cause?.constraint?.fields;
    if (isStringArray(adapterFields)) return adapterFields;

    return [];
};
