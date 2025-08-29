"use client";

import { createContext, FC, ReactNode, useContext, useState, useEffect } from "react";
import { Language, Prisma } from "@prisma/client";
import { getSession, useSession } from "next-auth/react";
import { CircularProgress, Stack } from "@mui/material";
import { useRouter } from "next/navigation";

interface UserContextValue {
    user: Prisma.UserGetPayload<{ include: { user_membership: true; skill_badges: true } }> | null;
    language: Language;
    setLanguage: (language: Language) => void; // eslint-disable-line no-unused-vars
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

const languageCookieName = "language";
const readLanguageFromCookie = (): Language => {
    try {
        const raw = document.cookie.split("; ").find((c) => c.startsWith(`${languageCookieName}=`));
        if (!raw) return Language.english;
        const value = decodeURIComponent(raw.split("=")[1] || "");
        if (Object.values(Language).includes(value as Language)) return value as Language;
        return Language.english;
    } catch (e) {
        return Language.english;
    }
};

interface UserContextProviderProps {
    children: ReactNode;
}

const UserContextProvider: FC<UserContextProviderProps> = ({ children }) => {
    const session = useSession();
    const router = useRouter();

    const [language, setLanguage] = useState<Language>(() => readLanguageFromCookie());

    // Persist language to a cookie whenever it changes
    useEffect(() => {}, [language]);
    const [editMode, setEditMode] = useState(false);

    const refreshSession = async () => {
        await getSession();
        router.refresh();
    };

    const updateLanguage = (newLanguage: Language) => {
        try {
            // 1 year max-age
            const maxAge = 60 * 60 * 24 * 365;
            document.cookie = `${languageCookieName}=${encodeURIComponent(newLanguage)}; path=/; max-age=${maxAge}`;
            setLanguage(newLanguage);
        } catch (e) {
            console.error(e);
            setLanguage(Language.english);
        }
    };

    const contextValue: UserContextValue = {
        user: session.data?.user || null,
        language,
        setLanguage: updateLanguage,
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
