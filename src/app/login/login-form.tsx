'use client'

import { useSearchParams } from "next/navigation";
import GlobalConstants from "../GlobalConstants"
import Form from "../ui/form/Form"
import { login } from "../lib/actions";

const LoginForm: React.FC = ()=>{
    const searchParams = useSearchParams();

    return <Form name={GlobalConstants.LOGIN} buttonLabel={GlobalConstants.LOGIN} action={login}/>
}

export default LoginForm