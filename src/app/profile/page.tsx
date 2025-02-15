'use client'

import GlobalConstants from "../GlobalConstants"
import Form, { FormActionState } from "../ui/form/Form"
import { useUserContext } from "../context/UserContext"
import { deleteUser, login, updateUser, updateUserCredentials } from "../lib/actions"
import { useState } from "react"
import { defaultActionState } from "../ui/Datagrid"
import { Button, Stack, Typography } from "@mui/material"

const ProfilePage = () => {
    const {user, updateLoggedInUser, logOut} = useUserContext()
    const [errorMsg, setErrorMsg] = useState("")

    const updateUserProfile = async (currentActionState: FormActionState, formData: FormData) => {
        const updateUserState = await updateUser(user[GlobalConstants.ID], currentActionState, formData)
        await updateLoggedInUser()
        return updateUserState
    }

    const validateAndUpdateCredentials = async (currentActionState: FormActionState, formData: FormData) => {
        const newActionState = {...currentActionState}
        // Check new and repeated passwords match
        if (formData.get(GlobalConstants.NEW_PASSWORD) !== formData.get(GlobalConstants.REPEAT_PASSWORD)) {
            newActionState.status = 500
            newActionState.result = ""
            newActionState.errorMsg = "Passwords do not match"
            return newActionState
        }

        // Check current password
        const validatedCurrentPassword = new FormData()
        validatedCurrentPassword.append(GlobalConstants.EMAIL, user[GlobalConstants.EMAIL])
        validatedCurrentPassword.append(GlobalConstants.PASSWORD, formData.get(GlobalConstants.CURRENT_PASSWORD))
        const validateCurrentResult = await login(currentActionState, validatedCurrentPassword)
        if (validateCurrentResult.status !== 200) return validateCurrentResult

        // Update credentials
        const updatedPassWord = new FormData()
        updatedPassWord.append(GlobalConstants.EMAIL, user[GlobalConstants.EMAIL])
        updatedPassWord.append(GlobalConstants.PASSWORD, formData.get(GlobalConstants.NEW_PASSWORD))
        const updateCredentialsState = await updateUserCredentials(currentActionState, updatedPassWord)
        return updateCredentialsState
    }

    const deleteMyAccount = async () => {
        const deleteState = await deleteUser(user[GlobalConstants.EMAIL], defaultActionState)
        if (deleteState.status !== 200) return setErrorMsg(deleteState.errorMsg)
        await logOut()
    }

    return <Stack>
        <Form name={GlobalConstants.PROFILE} buttonLabel="save" action={updateUserProfile} defaultValues={user}></Form>
        <Form name={GlobalConstants.USER_CREDENTIALS} buttonLabel="save" action={validateAndUpdateCredentials}></Form>
        {
            errorMsg && <Typography color="error">{errorMsg}</Typography>
        }
        <Button color="error" onClick={deleteMyAccount}>Delete My Account</Button>
    </Stack>
}

export default ProfilePage