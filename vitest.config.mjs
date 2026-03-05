import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
    plugins: [react()],
    poolOptions: {
        threads: {
            minThreads: 2,
            maxThreads: 4,
        },
    },
    test: {
        environment: "jsdom",
        css: true,
        server: {
            deps: {
                inline: ["@mui/x-data-grid"],
            },
        },
        setupFiles: ["./src/test/setup.ts"],
        globals: true,
        coverage: {
            provider: "v8",
            reporter: ["text"],
            exclude: [
                "node_modules/**",
                "src/test/**",
                "src/prisma/generated/**",
                "src/app/lib/auth/auth-types.ts",
            ],
        },
        // Improve test collection performance
        include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/.next/**",
            "**/coverage/**",
            "**/.{idea,git,cache,output,temp}/**",
        ],
        // Performance optimizations
        pool: "threads",
        testTimeout: 10000,
        hookTimeout: 10000,
        isolate: true,
        maxConcurrency: 5,
        // Speed up jest-dom operations
        environmentOptions: {
            jsdom: {
                resources: "usable",
            },
        },
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
});
