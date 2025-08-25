import dayjs, { Dayjs } from "dayjs";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Error from "next/error";

export const formatDate = (date: string | Date | Dayjs): string => dayjs(date).format("L HH:mm");
export const formatPrice = (price: number): number => price / 100;

export const navigateToRoute = (
    router: AppRouterInstance,
    route: string[],
    searchParams: { [key: string]: string } = {},
) => {
    const url = new URL(route.join("/"), window.location.origin);
    for (let [key, value] of Object.entries(searchParams)) {
        url.searchParams.set(key, value);
    }
    router.push(url.toString());
};

export const openResourceInNewTab = (resourceUrl: string) => {
    const newWindow = window.open(resourceUrl, "_blank", "noopener,noreferrer");
    // Prevent reverse tabnabbing
    if (newWindow) newWindow.opener = null;
};

export const allowRedirectException = (error: Error & { digest?: string }) => {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
        throw error;
    }
};
