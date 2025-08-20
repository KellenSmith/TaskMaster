"use client";

import { createContext, FC, ReactNode, use, useContext, useState } from "react";
import GlobalConstants from "../GlobalConstants";
import { Prisma } from "@prisma/client";

export const UserContext = createContext(null);

export const useUserContext = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUserContext must be used within UserContextProvider");
    return context;
};

interface UserContextProviderProps {
    loggedInUserPromise: Promise<Prisma.UserGetPayload<{ include: { userMembership: true } }>>;
    children: ReactNode;
}

const UserContextProvider: FC<UserContextProviderProps> = ({ loggedInUserPromise, children }) => {
    const [language, setLanguage] = useState(GlobalConstants.ENGLISH);
    const [editMode, setEditMode] = useState(false);
    const user = use(loggedInUserPromise);

    return (
        <UserContext.Provider
            value={{
                user,
                language,
                setLanguage,
                editMode,
                setEditMode,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export default UserContextProvider;
