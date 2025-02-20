import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    recommendedConfig: js.configs.recommended,
    baseDirectory: __dirname,
    files: ["**/*.ts", "**/*.tsx"],
    extends: ["next", "plugin:@typescript-eslint/recommended", "plugin:react/recommended"],
    plugins: ["@typescript-eslint", "react"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
            jsx: true,
        },
    },
    settings: {
        react: {
            version: "detect",
        },
    },
});

const eslintConfig = [
    ...compat.config({
        extends: ["eslint:recommended", "next"],
    }),
];

export default eslintConfig;
