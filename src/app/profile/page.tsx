"use client";

import GlobalConstants from "../GlobalConstants";
import Form, { FormActionState } from "../ui/form/Form";
import { useUserContext } from "../context/UserContext";
import {
  deleteUser,
  updateUser,
  updateUserCredentials,
} from "../lib/actions";
import {login} from '../lib/auth/auth'
import { useState } from "react";
import { defaultActionState } from "../ui/form/Form";
import { Button, Dialog, DialogContent, DialogContentText, DialogTitle, Stack, Typography } from "@mui/material";
import { isMembershipExpired } from "../lib/definitions";
import axios from "axios";
import { redirect, usePathname, useSearchParams } from "next/navigation";
import { ICreatePaymentRequestResponse } from "../api/swish/swish-utils";
import { OrgSettings } from "../lib/org-settings";
import Image from "next/image";

const ProfilePage = () => {
  const { user, updateLoggedInUser, logOut } = useUserContext();
  const [errorMsg, setErrorMsg] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateUserProfile = async (
    currentActionState: FormActionState,
    formData: FormData,
  ) => {
    const updateUserState = await updateUser(
      user[GlobalConstants.ID],
      currentActionState,
      formData,
    );
    await updateLoggedInUser();
    return updateUserState;
  };

  const validateAndUpdateCredentials = async (
    currentActionState: FormActionState,
    formData: FormData,
  ) => {
    const newActionState = { ...currentActionState };
    // Check new and repeated passwords match
    if (
      formData.get(GlobalConstants.NEW_PASSWORD) !==
      formData.get(GlobalConstants.REPEAT_PASSWORD)
    ) {
      newActionState.status = 500;
      newActionState.result = "";
      newActionState.errorMsg = "Passwords do not match";
      return newActionState;
    }

    // Check current password
    const validatedCurrentPassword = new FormData();
    validatedCurrentPassword.append(
      GlobalConstants.EMAIL,
      user[GlobalConstants.EMAIL],
    );
    validatedCurrentPassword.append(
      GlobalConstants.PASSWORD,
      formData.get(GlobalConstants.CURRENT_PASSWORD),
    );
    const validateCurrentResult = await login(
      currentActionState,
      validatedCurrentPassword,
    );
    if (validateCurrentResult.status !== 200) return validateCurrentResult;

    // Update credentials
    const updatedPassWord = new FormData();
    updatedPassWord.append(GlobalConstants.EMAIL, user[GlobalConstants.EMAIL]);
    updatedPassWord.append(
      GlobalConstants.PASSWORD,
      formData.get(GlobalConstants.NEW_PASSWORD),
    );
    const updateCredentialsState = await updateUserCredentials(
      currentActionState,
      updatedPassWord,
    );
    return updateCredentialsState;
  };

  const handleMobilePaymentFlow = async () => {
    try {
      const paymentRequestResponse =  await axios.get(`${OrgSettings[GlobalConstants.BASE_URL]}/api/swish`);
      if (!!paymentRequestResponse.data){
        const paymentRequest = paymentRequestResponse.data
        // TODO: check callback url
        const callbackUrl = ""
        const appUrl = `swish://paymentrequest?token=${paymentRequest.token}&callbackurl=${callbackUrl}`;
        // Open or redirect the user to the url
        redirect(appUrl);
      }
      
    } catch {
      setErrorMsg("Something went wrong while renewing your membership")
    }
    
  }

  const handleDesktopPaymentFlow = async () => {
    try {
      const createdPaymentRequestResponse = await axios.get(`${OrgSettings[GlobalConstants.BASE_URL]}/api/swish`, {
        responseType: 'arraybuffer'
      });
      
      if (createdPaymentRequestResponse.status === 200) {
          const qrCodeBlob = new Blob([createdPaymentRequestResponse.data], { type: 'image/png' });
          const url = URL.createObjectURL(qrCodeBlob);
          setQrCodeUrl(url);
       
      }
    } catch (error) {
      setErrorMsg("Something went wrong while renewing your membership")
    }
  }

  const renewMembership = async () => {
    // TODO: Redirect to swish app if on mobile, else show QR code 
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      await handleMobilePaymentFlow();
    } else {
      await handleDesktopPaymentFlow()
    }

    return defaultActionState;
  }

  const closeQrCodeDialog = () => {
    URL.revokeObjectURL(qrCodeUrl)
    setQrCodeUrl("")
  }

  const deleteMyAccount = async () => {
    const deleteState = await deleteUser(
      user,
      defaultActionState,
    );
    if (deleteState.status !== 200) return setErrorMsg(deleteState.errorMsg);
    await logOut();
  };

  return (
    <>
    <Stack>
      <Form
        name={GlobalConstants.PROFILE}
        buttonLabel="save"
        action={updateUserProfile}
        defaultValues={user}
      ></Form>
      <Form
        name={GlobalConstants.USER_CREDENTIALS}
        buttonLabel="save"
        action={validateAndUpdateCredentials}
      ></Form>
      {errorMsg && <Typography color="error">{errorMsg}</Typography>}
      {
        isMembershipExpired(user) && <Button onClick={renewMembership}>Renew membership</Button>
      }
      <Button color="error" onClick={deleteMyAccount}>
        Delete My Account
      </Button>
    </Stack>
    <Dialog open={!!qrCodeUrl}>
      <DialogTitle>Renew membership</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {
            `Scan the QR code to pay your membership fee of ${OrgSettings[GlobalConstants.MEMBERSHIP_FEE]} SEK`
          }
        </DialogContentText>
      <Image 
        alt="swish qr code" 
        src={qrCodeUrl} 
        width={OrgSettings[GlobalConstants.SWISH_QR_CODE_SIZE] as number} 
        height={OrgSettings[GlobalConstants.SWISH_QR_CODE_SIZE] as number}/>
        </DialogContent>
    </Dialog>
    </>
  );
};

export default ProfilePage;
