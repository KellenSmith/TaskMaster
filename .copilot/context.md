# TaskMaster Codebase Context

## Authentication Flow
```typescript
// Server actions must verify JWT tokens
const jwtPayload = await decryptJWT();
if (!jwtPayload) {
    return { status: 401, errorMsg: "Unauthorized", result: "" };
}

// Check user authorization for specific actions
if (!isUserAuthorized(path, jwtPayload)) {
    return { status: 403, errorMsg: "Forbidden", result: "" };
}
```

## Common Patterns

### Server Action Structure
```typescript
"use server";

export const actionName = async (
    currentState: FormActionState,
    fieldValues: SchemaType,
): Promise<FormActionState> => {
    const newActionState = { ...currentState };
    
    try {
        // Validate authorization
        const jwtPayload = await decryptJWT();
        if (!jwtPayload) {
            newActionState.status = 401;
            newActionState.errorMsg = "Unauthorized";
            return newActionState;
        }

        // Validate input with Zod
        const validatedData = schema.parse(fieldValues);
        
        // Perform database operation
        const result = await prisma.model.operation(validatedData);
        
        newActionState.result = result;
    } catch (error) {
        console.error("Error in actionName:", error);
        newActionState.status = 500;
        newActionState.errorMsg = "Internal server error";
    }
    
    return newActionState;
};
```

### Component Structure
```typescript
"use client"; // Only when interactivity is needed

import { FormActionState, defaultFormActionState } from "@/lib/definitions";
import { useActionState } from "react";

export default function ComponentName() {
    const [actionState, formAction] = useActionState(serverAction, defaultFormActionState);
    
    return (
        <form action={formAction}>
            {/* MUI components */}
        </form>
    );
}
```

### Database Query Patterns
```typescript
// Include related data efficiently
const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
        hostingEvents: true,
        participantEvents: {
            include: {
                Event: true
            }
        }
    }
});

// Use transactions for multi-table operations
const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({...});
    const credentials = await tx.userCredentials.create({...});
    return { user, credentials };
});
```

## Key Helper Functions
- `isUserAuthorized(path, user)` - Check route access
- `isMembershipExpired(user)` - Check membership status
- `isUserAdmin(user)` - Check admin role
- `isUserHost(user, event)` - Check event hosting rights
- `decryptJWT()` - Get current user from token

## Global Constants Usage
Always use GlobalConstants for string literals:
```typescript
user[GlobalConstants.ID] // Instead of user.id
GlobalConstants.ADMIN // Instead of "admin"
```
