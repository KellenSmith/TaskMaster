'use client'

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getLoggedInUser } from '../lib/actions';
import { defaultActionState } from '../ui/form/Form';

export const UserContext = createContext(null);

export const useUserContext = () => useContext(UserContext)

interface UserContextProviderProps {
    children: ReactNode
}

const UserContextProvider: React.FC<UserContextProviderProps> = ({children}) => {
    const [user, setUser] = useState(null)

    const updateLoggedInUser = async () => {
        const serverResponse = await getLoggedInUser(defaultActionState)
        if (serverResponse.status===200) setUser(JSON.parse(serverResponse.result))
    }

    useEffect(()=>{
        updateLoggedInUser()
    }, [])

    return (
        <UserContext.Provider value={{user, setUser}}>
            {children}
        </UserContext.Provider>
    )
}

export default UserContextProvider;