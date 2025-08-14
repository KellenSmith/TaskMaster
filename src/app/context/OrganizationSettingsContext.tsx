"use client";

import {
    createContext,
    FC,
    ReactNode,
    startTransition,
    useContext,
    useEffect,
    useState,
} from "react";
import { getLoggedInUser } from "../lib/user-actions";
import { deleteUserCookie, login } from "../lib/auth/auth";
import { useRouter } from "next/navigation";
import { defaultFormActionState, FormActionState, LoginSchema } from "../lib/definitions";
import { navigateToRoute } from "../ui/utils";
import GlobalConstants from "../GlobalConstants";
import { getOrganizationSettings } from "../lib/organization-settings-actions";
import { OrganizationSettings } from "@prisma/client";

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

    console.log(organizationSettings);

    return (
        <OrganizationSettingsContext.Provider
            value={{ organizationSettings, fetchOrganizationSettings: refreshOrganizationSettings }}
        >
            {children}
        </OrganizationSettingsContext.Provider>
    );
};

export default OrganizationSettingsProvider;
