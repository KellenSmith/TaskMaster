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
import { defaultActionState, FormActionState } from "../ui/form/Form";
import { useRouter } from "next/navigation";
import { LoginSchema } from "../lib/definitions";
import { navigateToRoute } from "../ui/utils";
import GlobalConstants from "../GlobalConstants";

export const UserContext = createContext(null);

export const useUserContext = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUserContext must be used within UserContextProvider");
    return context;
};

interface UserContextProviderProps {
    children: ReactNode;
}

const UserContextProvider: FC<UserContextProviderProps> = ({ children }) => {
    const [user, setUser] = useState(null);
    const [language, setLanguage] = useState(GlobalConstants.ENGLISH);
    const router = useRouter();

    const updateLoggedInUser = async () => {
        const serverResponse = await getLoggedInUser(defaultActionState);
        if (serverResponse.status === 200) {
            const loggedInUser = JSON.parse(serverResponse.result);
            setUser(loggedInUser);
            return loggedInUser;
        }
    };

    const loginAndUpdateUser = async (
        currentActionState: FormActionState,
        fieldValues: LoginSchema,
    ) => {
        const logInActionState = await login(currentActionState, fieldValues);
        if (logInActionState.status === 200) {
            setUser(JSON.parse(logInActionState.result));
            logInActionState.result = "Logged in successfully. Wait to be redirected";
            navigateToRoute("/", router);
        }
        return logInActionState;
    };

    const logOut = async () => {
        setUser(null);
        startTransition(async () => {
            await deleteUserCookie();
        });
        navigateToRoute("/", router);
    };

    useEffect(() => {
        updateLoggedInUser();
    }, []);

    return (
        <UserContext.Provider
            value={{
                user,
                logOut,
                login: loginAndUpdateUser,
                updateLoggedInUser,
                language,
                setLanguage,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export default UserContextProvider;
