import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        globals: true,
        coverage: {
            provider: "v8",
            reporter: ["text"],
            exclude: ["node_modules/**", "src/test/**"],
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
        poolOptions: {
            threads: {
                minThreads: 2,
                maxThreads: 4,
            },
        },
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
