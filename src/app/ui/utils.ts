import dayjs, { Dayjs } from "dayjs";
import GlobalConstants from "../GlobalConstants";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export const formatDate = (date: string | Date | Dayjs): string => dayjs(date).format("L HH:mm");

export const getDummyId = (existingItems: any[]) =>
    existingItems?.length > 0
        ? existingItems
              .map((item: any) => item[GlobalConstants.ID])
              .sort((id1: string, id2: string) => id1.localeCompare(id2))
              .at(-1) + "+"
        : "+";

export const apiEndpoints = {
    BUY_EVENT_TICKET: "api/swish/buy-event-ticket",
    PAYMENT_REQUEST_QR_CODE: "api/swish/payment-request-qr-code",
    PAYMENT_REQUEST_TOKEN: "api/swish/payment-request-token",
    RENEW_MEMBERSHIP: "api/swish/renew-membership",
};

interface RequestProps {
    endpoint: string;
    searchParams?: [string, string][];
    body?: any;
    options?: AxiosRequestConfig;
}
export const makeApiRequest = async ({
    endpoint,
    searchParams,
    body,
    options,
}: RequestProps): Promise<AxiosResponse> => {
    const requestConfig = { withCredentials: true, ...options };

    const url = new URL(endpoint, process.env.NEXT_PUBLIC_API_URL);
    for (const [key, value] of searchParams) {
        url.searchParams.set(key, value);
    }
    if (body) return await axios.post(url.toString(), body, requestConfig);
    return await axios.get(url.toString(), requestConfig);
};

export const navigateToRoute = (route: string, router) => {
    console.log(`${process.env.NEXT_PUBLIC_API_URL}${route}`);
    router.push(`${process.env.NEXT_PUBLIC_API_URL}${route}`);
};
