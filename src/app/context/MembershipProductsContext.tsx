"use client";

import { createContext, FC, ReactNode, useContext } from "react";
import { Prisma } from "../../prisma/generated/browser";

export type MembershipProduct = Prisma.MembershipGetPayload<{
    include: {
        product: { select: { id: true; name: true; description: true; price: true } };
    };
}>;

interface MembershipProductsContextValue {
    /**
     * Every membership product the organization offers. Exposed as a promise so
     * only components that `use()` it suspend, not the whole page.
     */
    membershipProductsPromise: Promise<MembershipProduct[]>;
}

export const MembershipProductsContext = createContext<MembershipProductsContextValue | null>(null);

export const useMembershipProductsContext = (): MembershipProductsContextValue => {
    const context = useContext(MembershipProductsContext);
    if (!context)
        throw new Error(
            "useMembershipProductsContext must be used within MembershipProductsProvider",
        );
    return context;
};

interface MembershipProductsProviderProps {
    membershipProductsPromise: Promise<MembershipProduct[]>;
    children: ReactNode;
}

const MembershipProductsProvider: FC<MembershipProductsProviderProps> = ({
    membershipProductsPromise,
    children,
}) => (
    <MembershipProductsContext.Provider value={{ membershipProductsPromise }}>
        {children}
    </MembershipProductsContext.Provider>
);

export default MembershipProductsProvider;
