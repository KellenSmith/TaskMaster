"use client";

import { createContext, FC, ReactNode, useContext, useState } from "react";
import GlobalConstants from "../GlobalConstants";
import { Prisma } from "@prisma/client";

interface UserContextValue {
    user: Prisma.UserGetPayload<{ include: { userMembership: true } }>;
    language: string;
    setLanguage: (language: string) => void;
    editMode: boolean;
    setEditMode: (editMode: boolean) => void;
}

export const UserContext = createContext<UserContextValue | null>(null);

export const useUserContext = (): UserContextValue => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUserContext must be used within UserContextProvider");
    return context;
};

interface UserContextProviderProps {
    loggedInUser: Prisma.UserGetPayload<{ include: { userMembership: true } }>;
    children: ReactNode;
}

const UserContextProvider: FC<UserContextProviderProps> = ({ loggedInUser, children }) => {
    const [language, setLanguage] = useState(GlobalConstants.ENGLISH);
    const [editMode, setEditMode] = useState(false);

    const contextValue: UserContextValue = {
        user: loggedInUser,
        language,
        setLanguage,
        editMode,
        setEditMode,
    };

    return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export default UserContextProvider;
