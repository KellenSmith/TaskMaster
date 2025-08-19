"use client";

import { createContext, FC, ReactNode, use, useContext } from "react";
import { OrganizationSettings } from "@prisma/client";
import { CircularProgress } from "@mui/material";

export const OrganizationSettingsContext = createContext(null);

export const useOrganizationSettingsContext = () => {
    const context = useContext(OrganizationSettingsContext);
    if (!context)
        throw new Error(
            "useOrganizationSettingsContext must be used within OrganizationSettingsProvider",
        );
    return context;
};

interface OrganizationSettingsProviderProps {
    organizationSettingsPromise: Promise<OrganizationSettings>;
    children: ReactNode;
}

const OrganizationSettingsProvider: FC<OrganizationSettingsProviderProps> = ({
    organizationSettingsPromise,
    children,
}) => {
    const organizationSettings = use(organizationSettingsPromise);

    return (
        <OrganizationSettingsContext.Provider value={{ organizationSettings }}>
            {organizationSettings ? children : <CircularProgress />}
        </OrganizationSettingsContext.Provider>
    );
};

export default OrganizationSettingsProvider;
