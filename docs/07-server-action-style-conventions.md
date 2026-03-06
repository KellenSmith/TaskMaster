# Server Action Style Conventions

This document defines conventions for server actions in this project.

## Scope

- Applies to all server action files in `src/app/lib`.
- Applies to files named `*-actions.ts`.

## File Placement And Naming

- Write mutating server actions in `src/app/lib/*-actions.ts`.
- Name files with the `-actions.ts` suffix.
- Do not place read-only `get*` actions in `*-actions.ts` by default.

## Input Validation And Sanitization

All functions in `*-actions.ts` must defensively handle input.

- Parse all incoming values using a schema (for example Zod schemas in `zod-schemas.ts`).
- Validate route params and IDs explicitly (for example UUID parsing).
- Sanitize all user-provided strings before persistence or rendering.
- Never trust client-side validation as sufficient.

## Return Contract

- Mutating server actions should return `void` on success.
- A successful action should not return custom success payloads.
- Use cache invalidation (`revalidateTag`) and side effects as needed, but keep return type `Promise<void>`.

## Read-Only Get Actions

- Place `get*` actions in one of these locations:
  - In the server component where they are used.
  - In a dedicated helper file (for example `*-helpers.ts`).
- Keep `*-actions.ts` focused on create/update/delete and other mutating operations.

## Error Handling And Localization

When a function fails, return an error message in the user's language.

- Resolve user language with `getUserLanguage()`.
- Produce localized error text based on that language.
- Do not return hard-coded English-only errors from action boundaries.
- Keep error messages user-safe and actionable.

## Recommended Pattern

```ts
"use server";

import { getUserLanguage } from "./user-helpers";
import { Language } from "../../prisma/generated/enums";
import Languagetranslations from "./Languagetranslations";

export const updateSomething = async (formData: FormData): Promise<void | string> => {
    try {
        // 1) Parse and validate
        // 2) Sanitize
        // 3) Perform mutation
        return;
    } catch {
        const language = await getUserLanguage();
        return Languagetranslations.somethingWentWrong[language];
    }
};
```

Use this as a behavioral template. Exact implementation details may vary by action.

## Checklist For New Actions

- File is under `src/app/lib` and named `*-actions.ts`.
- All inputs are parsed and validated.
- All user input is sanitized before use.
- Success path returns `void`.
- Failure path returns localized error text using `getUserLanguage()`.
- Any read-only `get*` logic is in the server component or a helper file.
