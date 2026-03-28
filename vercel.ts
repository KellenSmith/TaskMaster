import { type VercelConfig } from "@vercel/config/v1";

const vercelConfig: VercelConfig = {
    buildCommand: "pnpm backup:db:if-production && pnpm build",
    framework: "nextjs",
    devCommand: "pnpm dev",
    installCommand: "bash scripts/install-postgresql17.sh && pnpm install",
    git: {
        deploymentEnabled: false,
    },
    crons: [
        {
            path: "/api/cron",
            schedule: "0 4 * * *", // Every day at 4:00 AM
        },
    ],
};

export default vercelConfig;
