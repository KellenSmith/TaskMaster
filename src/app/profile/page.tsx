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
import { redirect } from "next/navigation";
import { OrgSettings } from "../lib/org-settings";
import Image from "next/image";
import dayjs from "dayjs";
import { SwishConstants } from "../lib/swish-constants";

const ProfilePage = () => {
  const { user, updateLoggedInUser, logOut } = useUserContext();
  const [errorMsg, setErrorMsg] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [paymentStatus, setPaymentStatus] = useState(SwishConstants.PENDING)

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

  /**
   * Wait for payment for 5 minutes
   * Update user every 5 seconds. If membership is valid, stop waiting.
   */
  const waitForMembershipRenewal = async () => {
    const startTime = dayjs()
    const intervalId = setInterval(async () => {
        if (dayjs().isAfter(startTime.add(5*60, 's'))){
          clearInterval(intervalId)
          setPaymentStatus(SwishConstants.EXPIRED)
        }
        const updatedUser = await updateLoggedInUser()
        if (!isMembershipExpired(updatedUser)) {
          clearInterval(intervalId)
          setPaymentStatus(SwishConstants.PAID)
        }
    }, 5000);
  }

  const simulateSwishPayment = async () => {
    // Simulate response from swish
      const examplePaymentConf = {
        "id": "0902D12C7FAE43D3AAAC49622AA79FEF",
        "payeePaymentReference": "0123456789",
        "paymentReference": "652ED6A2BCDE4BA8AD11D7334E9567B7",
        "callbackUrl": "https://example.com/api/swishcb/paymentrequests",
        "payerAlias": "46712347689",
        "payeeAlias": "1234679304",
        "amount": 100.00,
        "currency": "SEK",
        "message": "bf558bcb-18aa-4d57-953c-ef1acc95859d", // kellen3 user id
        "status": "PAID",
        "dateCreated": "2022-04-13T09:05:32.717Z",
        "datePaid": dayjs().toISOString(),
        "errorCode": null,
        "errorMessage": null
    }
    await axios.post(`${OrgSettings[GlobalConstants.BASE_URL]}/api/swish`, examplePaymentConf);
  }

  const handleDesktopPaymentFlow = async () => {
    try {
      const createdPaymentRequestResponse = await axios.get(`${OrgSettings[GlobalConstants.BASE_URL]}/api/swish?${GlobalConstants.ID}=${user[GlobalConstants.ID]}`, {
        responseType: 'arraybuffer'
      });
      
      if (createdPaymentRequestResponse.status === 200) {
          const qrCodeBlob = new Blob([createdPaymentRequestResponse.data], { type: 'image/png' });
          const url = URL.createObjectURL(qrCodeBlob);
          setQrCodeUrl(url);
      }
    } catch (error) {
      setPaymentStatus(SwishConstants.ERROR)
    }
  }

  const renewMembership = async () => {
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      await handleMobilePaymentFlow();
    } else {
      await handleDesktopPaymentFlow()
      await waitForMembershipRenewal()
    }
  }

  const getPaymentStatusMsg = ()=>{
    switch (paymentStatus){
      case SwishConstants.PENDING:
        return "Awaiting your payment..."
      case SwishConstants.PAID:
        return "Thank you for your payment! Your membership has been renewed"
      case SwishConstants.EXPIRED:
        return "Your payment request expired"
      default: {
        return "Something went wrong..."
      }
    }
    
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
    <Dialog open={!!qrCodeUrl} onClose={closeQrCodeDialog}>
      <DialogTitle>Renew membership</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {
            `Scan the QR code to pay your membership fee of ${OrgSettings[GlobalConstants.MEMBERSHIP_FEE]} SEK`
          }
        </DialogContentText>
          {
            qrCodeUrl &&
            <Image 
              alt="swish qr code" 
              src={qrCodeUrl} 
              width={OrgSettings[GlobalConstants.SWISH_QR_CODE_SIZE] as number} 
              height={OrgSettings[GlobalConstants.SWISH_QR_CODE_SIZE] as number}/>
          }
      
        <DialogContentText>{getPaymentStatusMsg()}</DialogContentText>
        <Button onClick={simulateSwishPayment}>simulate pay</Button>
        </DialogContent>
    </Dialog>
    </>
  );
};

export default ProfilePage;
