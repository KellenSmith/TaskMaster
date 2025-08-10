export const SwishConstants = {
    PENDING: "PENDING",
    PAID: "PAID",
    EXPIRED: "EXPIRED",
    ERROR: "ERROR",
    CALLBACK_URL: `${process.env.VERCEL_URL}/api/swish`,
    AMOUNT: "amount",
};
