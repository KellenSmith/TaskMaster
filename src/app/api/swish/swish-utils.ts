"use server";

import { v4 as uuidv4 } from "uuid";
import { swish } from "./swish-client";
import { OrgSettings } from "../../lib/org-settings";
import GlobalConstants from "../../GlobalConstants";
import { SwishConstants } from "../../lib/swish-constants";

export interface ICreatePaymentRequestResponse {
  id: string;
  token: string;
}

export const createPaymentRequest = async (
  amount: number,
  message: string
): Promise<ICreatePaymentRequestResponse | null> => {
  // Lowercase and "-" disallowed by Swish
  const instructionUUID = uuidv4().toUpperCase().replaceAll("-", "");

  const data = {
    payeeAlias: OrgSettings[GlobalConstants.SWISH_PAYEE_ALIAS],
    currency: "SEK",
    callbackUrl: SwishConstants.CALLBACK_URL,
    amount: amount,
    message: message,
    callbackIdentifier: "11A86BE70EA346E4B1C39C874173F478",
  };

  try {
    const response = await swish.put(
      `${
        OrgSettings[GlobalConstants.SWISH_BASE_URL]
      }paymentrequests/${instructionUUID}`,
      data
    );

    if (response.status === 201) {
      const { paymentrequesttoken } = response.headers;
      return { id: instructionUUID, token: paymentrequesttoken };
    }
  } catch (error) {
    console.log(error.response);
    return null;
  }
};

export const getQrCodeForPaymentRequest = async (
  paymentRequest: ICreatePaymentRequestResponse
): Promise<ArrayBuffer | null> => {
  const data = {
    token: paymentRequest.token,
    size: OrgSettings[GlobalConstants.SWISH_QR_CODE_SIZE],
    format: "png",
    border: "0",
  };

  try {
    const response = await swish.post(
      `https://mpc.getswish.net/qrg-swish/api/v1/commerce`,
      data,
      { responseType: "arraybuffer" }
    );

    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    return null;
  }
};

export interface IPaymentRequestConfirmed {
  id: string;
  payeePaymentReference: string;
  paymentReference: string;
  callbackUrl: string;
  payerAlias?: string;
  payeeAlias: string;
  amount: number;
  currency: string;
  message: string;
  status: string;
  dateCreated: string;
  datePaid: string;
  errorCode: number | null;
  errorMessage: string | null;
}

async function getPaymentRequest(paymentRequest: IPaymentRequestConfirmed) {
  try {
    const response = await swish.get(
      `https://mss.cpc.getswish.net/swish-cpcapi/api/v1/paymentrequests/${paymentRequest.id}`
    );

    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    return null;
  }
}
