'use client'

import GlobalConstants from "../GlobalConstants"
import Form, { FormActionState } from "../ui/form/Form"
import { useUserContext } from "../context/UserContext"
import { login, updateUser, updateUserCredentials } from "../lib/actions"

const ProfilePage = () => {
    const {user, updateLoggedInUser} = useUserContext()

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

    return <>
        <Form name={GlobalConstants.PROFILE} buttonLabel="save" action={updateUserProfile} defaultValues={user}></Form>
        <Form name={GlobalConstants.USER_CREDENTIALS} buttonLabel="save" action={validateAndUpdateCredentials}></Form>
    </>
}

export default ProfilePage