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
import { getLoggedInUser } from "../lib/actions";
import { deleteUserCookie, login } from "../lib/auth/auth";
import { defaultActionState, FormActionState } from "../ui/form/Form";
import { redirect } from "next/navigation";

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

    const updateLoggedInUser = async () => {
        const serverResponse = await getLoggedInUser(defaultActionState);
        if (serverResponse.status === 200) {
            const loggedInUser = JSON.parse(serverResponse.result);
            setUser(loggedInUser);
            return loggedInUser;
        }
    };

    const loginAndUpdateUser = async (currentActionState: FormActionState, formData: FormData) => {
        const logInActionState = await login(currentActionState, formData);
        if (logInActionState.status === 200) {
            setUser(JSON.parse(logInActionState.result));
            redirect("/");
        }
        return logInActionState;
    };

    const logOut = async () => {
        setUser(null);
        startTransition(async () => {
            await deleteUserCookie();
        });
        redirect("/");
    };

    useEffect(() => {
        updateLoggedInUser();
    }, []);

    return (
        <UserContext.Provider
            value={{ user, logOut, login: loginAndUpdateUser, updateLoggedInUser }}
        >
            {children}
        </UserContext.Provider>
    );
};

export default UserContextProvider;
