import { Prisma } from "@prisma/client";

declare module "next-auth" {
    /**
     * The shape of the user object returned in the OAuth providers' `profile` callback,
     * or the second parameter of the `session` callback, when using a database.
     */
    interface User
        extends Prisma.UserGetPayload<{ select: { id: true; status: true; role: true } }> {}

    /**
     * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    // eslint-disable-next-line no-unused-vars
    interface Session {
        user: User;
    }
}

declare module "@auth/core/jwt" {
    /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
    // eslint-disable-next-line no-unused-vars
    interface JWT
        extends Prisma.UserGetPayload<{ select: { id: true; status: true; role: true } }> {}
}
