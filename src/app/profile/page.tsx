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
        const validateCurrentPassword = new FormData()
        validateCurrentPassword.set(GlobalConstants.EMAIL, user[GlobalConstants.EMAIL])
        validateCurrentPassword.set(GlobalConstants.PASSWORD, formData.get(GlobalConstants.PASSWORD))
        const validateCurrentResult = await login(currentActionState, validateCurrentPassword)
        console.log(validateCurrentResult)
        if (validateCurrentResult.status !== 200) return validateCurrentResult

        const updateUserState = await updateUserCredentials(user[GlobalConstants.ID], currentActionState, formData)
        await updateLoggedInUser()
        return updateUserState
    }

    return <>
        <Form name={GlobalConstants.PROFILE} buttonLabel="save" action={updateUserProfile} defaultValues={user}></Form>
        <Form name={GlobalConstants.USER_CREDENTIALS} buttonLabel="save" action={validateAndUpdateCredentials}></Form>
    </>
}

export default ProfilePage