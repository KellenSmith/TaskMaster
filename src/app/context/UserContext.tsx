"use client";

import { createContext, FC, ReactNode, useContext, useState } from "react";
import { Prisma } from "@prisma/client";
import { getSession, useSession } from "next-auth/react";
import { CircularProgress, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import { Language } from "../LanguageTranslations";

interface UserContextValue {
    user: Prisma.UserGetPayload<{ include: { user_membership: true; skill_badges: true } }> | null;
    language: string;
    setLanguage: (language: string) => void; // eslint-disable-line no-unused-vars
    editMode: boolean;
    setEditMode: (editMode: boolean | ((prev: boolean) => boolean)) => void; // eslint-disable-line no-unused-vars
    refreshSession: () => Promise<void>;
}

export const UserContext = createContext<UserContextValue | null>(null);

export const useUserContext = (): UserContextValue => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUserContext must be used within UserContextProvider");
    return context;
};

interface UserContextProviderProps {
    children: ReactNode;
}

const UserContextProvider: FC<UserContextProviderProps> = ({ children }) => {
    const session = useSession();
    const router = useRouter();
    const [language, setLanguage] = useState(Language.english);
    const [editMode, setEditMode] = useState(false);

    const refreshSession = async () => {
        await getSession();
        router.refresh();
    };

    const contextValue: UserContextValue = {
        user: session.data?.user || null,
        language,
        setLanguage,
        editMode,
        setEditMode,
        refreshSession,
    };

    if (session.status === "loading")
        return (
            <Stack height="100%" width="100%" justifyContent="center" alignItems="center">
                <CircularProgress />
            </Stack>
        );

    return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export default UserContextProvider;
