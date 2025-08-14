"use client";

import { createContext, FC, ReactNode, useContext, useEffect, useState } from "react";
import { getOrganizationSettings } from "../lib/organization-settings-actions";
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
    children: ReactNode;
}

const OrganizationSettingsProvider: FC<OrganizationSettingsProviderProps> = ({ children }) => {
    const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings | null>(
        null,
    );

    const refreshOrganizationSettings = async (): Promise<void> => {
        // Fetch organization settings from API or other source
        const settings = await getOrganizationSettings();
        setOrganizationSettings(settings);
    };

    useEffect(() => {
        refreshOrganizationSettings();
    }, []);

    return (
        <OrganizationSettingsContext.Provider
            value={{ organizationSettings, refreshOrganizationSettings }}
        >
            {organizationSettings ? children : <CircularProgress />}
        </OrganizationSettingsContext.Provider>
    );
};

export default OrganizationSettingsProvider;
