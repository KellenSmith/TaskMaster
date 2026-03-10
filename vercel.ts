import { type VercelConfig } from "@vercel/config/v1";

export const vercelConfig: VercelConfig = {
    buildCommand: "pnpm build",
    framework: "nextjs",
    devCommand: "pnpm dev",
    crons: [
        {
            path: "/api/cron",
            schedule: "0 4 * * *",
        },
    ],
};
