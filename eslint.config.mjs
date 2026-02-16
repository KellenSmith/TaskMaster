import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import vitest from "@vitest/eslint-plugin";

export default [
    {
        ignores: [
            "node_modules/**",
            ".next/**",
            "out/**",
            "build/**",
            "next-env.d.ts",
            "dist/**",
            "src/prisma/generated/**",
        ],
    },
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                // Browser globals
                window: "readonly",
                document: "readonly",
                navigator: "readonly",
                FormData: "readonly",
                URL: "readonly",
                URLSearchParams: "readonly",
                fetch: "readonly",
                Request: "readonly",
                Response: "readonly",
                Headers: "readonly",
                console: "readonly",
                alert: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                requestAnimationFrame: "readonly",
                cancelAnimationFrame: "readonly",
                ResizeObserver: "readonly",
                HTMLElement: "readonly",
                HTMLDivElement: "readonly",
                HTMLFormElement: "readonly",
                HTMLInputElement: "readonly",
                Element: "readonly",
                File: "readonly",
                DOMRect: "readonly",
                PointerEvent: "readonly",
                React: "readonly",
                Window: "readonly",
                // Node.js globals
                process: "readonly",
                global: "readonly",
                __filename: "readonly",
                __dirname: "readonly",
                Buffer: "readonly",
                // Vitest globals
                describe: "readonly",
                it: "readonly",
                test: "readonly",
                expect: "readonly",
                vi: "readonly",
                beforeAll: "readonly",
                afterAll: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            "@next/next": nextPlugin,
            "react-hooks": reactHooksPlugin,
            vitest
        },
        rules: {
            ...js.configs.recommended.rules,
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/no-explicit-any": "warn",
            "@next/next/no-html-link-for-pages": "error",
            "react-hooks/exhaustive-deps": "warn",
            "no-redeclare": "warn",
        },
    },
    {
        files: ["**/*.test.ts", "src/test/*.ts"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
        },
    }
];
