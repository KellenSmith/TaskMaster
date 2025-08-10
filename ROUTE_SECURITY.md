# Route Security Documentation

This document explains how the route security system works in TaskMaster and how to add new secured routes.

## Security Levels

TaskMaster implements a three-tier route security system:

### 1. Public Routes
- **Access**: Available to all users (logged in or not)
- **Use cases**: Landing pages, login, registration, public information
- **Current routes**: home (`""`), login, reset, apply

### 2. Private Routes  
- **Access**: Available to logged-in members with active memberships
- **Use cases**: Member features, personal dashboards, member content
- **Current routes**: profile, calendar
- **Note**: Users with expired memberships can only access their profile page

### 3. Admin Routes
- **Access**: Available to users with admin role and active memberships
- **Use cases**: Administrative functions, user management, system configuration  
- **Current routes**: members, sendout

## How It Works

The security system operates at multiple layers:

### 1. Route Definition (`src/app/lib/definitions.ts`)
Routes are defined in a single location using the `routes` object:

```typescript
export const routes = {
    [GlobalConstants.PUBLIC]: [
        GlobalConstants.HOME,
        GlobalConstants.LOGIN,
        // ... other public routes
    ],
    [GlobalConstants.PRIVATE]: [
        GlobalConstants.PROFILE,
        GlobalConstants.CALENDAR,
        // ... other private routes  
    ],
    [GlobalConstants.ADMIN]: [
        GlobalConstants.MEMBERS,
        GlobalConstants.SENDOUT,
        // ... other admin routes
    ],
};
```

### 2. Middleware Security (`src/middleware.ts`)
The middleware intercepts all requests and:
- Extracts the user's authentication status from JWT tokens
- Calls `isUserAuthorized()` to check if the user can access the requested path
- Redirects unauthorized users to the home page
- Redirects logged-in users away from the login page

### 3. UI Navigation (`src/app/ui/NavPanel.tsx`)  
The navigation menu automatically:
- Filters visible menu items based on user permissions
- Only shows routes that the current user is authorized to access

### 4. Authorization Logic (`isUserAuthorized` function)
The authorization logic handles:
- **Non-logged users**: Only public routes allowed
- **Expired membership**: Only public routes + profile page allowed
- **Active members**: All routes except admin routes allowed
- **Admin users**: All routes allowed (but still requires active membership)

## Adding New Routes

To add a new route to the system:

### Step 1: Define the Route Constant
Add the route name to `GlobalConstants.ts`:

```typescript
const GlobalConstants = {
    // ... existing constants
    MY_NEW_ROUTE: "my-new-route",
};
```

### Step 2: Classify the Route
Add the route to the appropriate security level in `src/app/lib/definitions.ts`:

```typescript
export const routes = {
    [GlobalConstants.PUBLIC]: [
        // ... existing public routes
        GlobalConstants.MY_NEW_ROUTE, // if public
    ],
    [GlobalConstants.PRIVATE]: [
        // ... existing private routes  
        GlobalConstants.MY_NEW_ROUTE, // if private
    ],
    [GlobalConstants.ADMIN]: [
        // ... existing admin routes
        GlobalConstants.MY_NEW_ROUTE, // if admin
    ],
};
```

### Step 3: Create the Page Component
Create your page component at `src/app/(pages)/my-new-route/page.tsx`:

```typescript
const MyNewRoutePage = () => {
    return (
        <div>
            {/* Your page content */}
        </div>
    );
};

export default MyNewRoutePage;
```

### Step 4: Test the Security
The route will be automatically secured by the middleware. Test that:
- Unauthorized users are redirected appropriately  
- The route appears in navigation for authorized users only
- The route is hidden from unauthorized users in navigation

## Security Testing

Comprehensive tests exist for the security system:

- **Route Security Tests** (`src/app/lib/definitions.test.ts`): Tests the authorization logic for all user types and edge cases
- **Middleware Tests** (`src/test/middleware.test.ts`): Tests the middleware layer security enforcement

Run tests with: `npm test`

## Best Practices

1. **Always classify new routes**: Every new route should be explicitly added to one of the three security levels
2. **Test security**: Manually verify that your route behaves correctly for different user types  
3. **Use semantic naming**: Route names should clearly indicate their purpose
4. **Document admin features**: Admin routes should be clearly documented for other developers
5. **Consider membership expiration**: Remember that expired members have limited access

## Security Considerations

- **Defense in depth**: Security is enforced at both middleware and UI levels
- **Graceful degradation**: Users see appropriate content based on their access level
- **Membership expiration**: Even admins need active memberships for admin functions
- **JWT-based authentication**: Secure token-based authentication with automatic expiration
- **Redirect protection**: Unauthorized access attempts are redirected rather than showing errors

## Troubleshooting

### Route not appearing in navigation
- Check that the route is properly classified in `definitions.ts`
- Verify the user has the correct permissions for that route type

### Getting redirected from your route  
- Ensure the route is added to the correct security level
- Check that your test user has the necessary role/membership status

### Navigation showing wrong routes
- The navigation automatically filters based on `isUserAuthorized()`
- This indicates the authorization logic is working correctly