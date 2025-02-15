'use client'

import GlobalConstants from "../GlobalConstants"
import Form from "../ui/form/Form"
import { login } from "../lib/actions";

const LoginForm: React.FC = ()=>{
    return <Form name={GlobalConstants.LOGIN} buttonLabel={GlobalConstants.LOGIN} action={login}/>
}

export default LoginForm