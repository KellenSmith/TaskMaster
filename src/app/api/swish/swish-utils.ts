import { v4 as uuidv4 } from "uuid";
import { swish } from "./swish-client";
import { OrgSettings } from "../../lib/org-settings";
import GlobalConstants from "../../GlobalConstants";

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
    callbackUrl: "https://example.com/swishcallback",
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
  } catch {}
};
