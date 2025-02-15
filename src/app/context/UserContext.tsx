'use client'

import { createContext, ReactNode, startTransition, useContext, useEffect, useState } from 'react';
import { getLoggedInUser } from '../lib/actions';
import { deleteUserCookie } from '../lib/auth/auth';
import { defaultActionState } from '../ui/form/Form';
import { redirect } from 'next/navigation';

export const UserContext = createContext(null);

export const useUserContext = () => {
    const context = useContext(UserContext)
    if (!context) throw new Error ("useUserContext must be used within UserContextProvider")
    return context;
}

interface UserContextProviderProps {
    children: ReactNode
}

const UserContextProvider: React.FC<UserContextProviderProps> = ({children}) => {
    const [user, setUser] = useState(null)

    const updateLoggedInUser = async () => {
        const serverResponse = await getLoggedInUser(defaultActionState)
        if (serverResponse.status === 200) setUser(JSON.parse(serverResponse.result))
    }

    const logOut = async () => {
        setUser(null);
        startTransition(async () => {
            await deleteUserCookie()
        })
        redirect("/")
    };

    useEffect(()=>{
        updateLoggedInUser()
    }, [])

    return (
        <UserContext.Provider value={{user, logOut}}>
            {children}
        </UserContext.Provider>
    )
}

export default UserContextProvider;