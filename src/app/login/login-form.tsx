'use client'

import GlobalConstants from "../GlobalConstants"
import Form, { FormActionState } from "../ui/form/Form"
import { login } from "../lib/actions";
import { useUserContext } from "../context/UserContext";
import { redirect } from "next/navigation";

const LoginForm: React.FC = ()=>{
    const {setUser} = useUserContext()

    const logInAndUpdateContext = async (currentActionState: FormActionState, formData: FormData) => {
        const logInActionState = await login(currentActionState, formData)
        if (logInActionState.status === 200) setUser(JSON.parse(logInActionState.result))
        redirect("/")
    }
    return <Form name={GlobalConstants.LOGIN} buttonLabel={GlobalConstants.LOGIN} action={logInAndUpdateContext}/>
}

export default LoginForm