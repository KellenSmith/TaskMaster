import { v4 as uuidv4 } from "uuid";
import { swish } from "./swish-client";
import GlobalConstants from "../../GlobalConstants";
import { SwishConstants } from "../../lib/swish-constants";
import { NextRequest } from "next/server";

export interface ICreatePaymentRequestResponse {
    id: string;
    token: string;
}

/**
 * Check that the request is sent from friendly frontend, i.e.
 * has coorect referrer and contains user credentials cookie.
 * */
export const isRequestAuthorized = (request: NextRequest) => {
    const requestReferrer = request.headers.get("referer");
    const requestCookie = request.cookies.get(GlobalConstants.USER_CREDENTIALS);
    return requestReferrer?.startsWith(process.env.NEXT_PUBLIC_API_URL) && requestCookie;
};

export const createPaymentRequest = async (
    amount: number,
    message: string,
): Promise<ICreatePaymentRequestResponse | null> => {
    // Lowercase and "-" disallowed by Swish
    const instructionUUID = uuidv4().toUpperCase().replaceAll("-", "");

    const data = {
        payeeAlias: process.env.SWISH_PAYEE_ALIAS,
        currency: "SEK",
        callbackUrl: SwishConstants.CALLBACK_URL,
        amount: amount,
        message: message,
        callbackIdentifier: "11A86BE70EA346E4B1C39C874173F478",
    };

    try {
        const response = await swish.put(
            `${process.env.SWISH_BASE_URL}paymentrequests/${instructionUUID}`,
            data,
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
