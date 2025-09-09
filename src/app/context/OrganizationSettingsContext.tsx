"use client";

import { createContext, FC, ReactNode, use, useContext } from "react";
import { Prisma } from "@prisma/client";
import { CircularProgress } from "@mui/material";

interface OrganizationSettingsContextValue {
    organizationSettings: Prisma.OrganizationSettingsGetPayload<true>;
    infopagesPromise?: Promise<
        Prisma.InfoPageGetPayload<{ include: { titleText: { include: { translations: true } } } }>[]
    >;
}

export const OrganizationSettingsContext = createContext<OrganizationSettingsContextValue | null>(
    null,
);

export const useOrganizationSettingsContext = () => {
    const context = useContext(OrganizationSettingsContext);
    if (!context)
        throw new Error(
            "useOrganizationSettingsContext must be used within OrganizationSettingsProvider",
        );
    return context;
};

interface OrganizationSettingsProviderProps {
    organizationSettingsPromise: Promise<Prisma.OrganizationSettingsGetPayload<true>>;
    infopagesPromise: Promise<
        Prisma.InfoPageGetPayload<{
            include: { titleText: { include: { translations: true } } };
        }>[]
    >;
    children: ReactNode;
}

const OrganizationSettingsProvider: FC<OrganizationSettingsProviderProps> = ({
    organizationSettingsPromise,
    infopagesPromise,
    children,
}) => {
    const organizationSettings = use(organizationSettingsPromise);

    return (
        <OrganizationSettingsContext.Provider value={{ organizationSettings, infopagesPromise }}>
            {organizationSettings ? children : <CircularProgress />}
        </OrganizationSettingsContext.Provider>
    );
};

export default OrganizationSettingsProvider;
