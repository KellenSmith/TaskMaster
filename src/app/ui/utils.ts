import dayjs, { Dayjs } from "dayjs";
import GlobalConstants from "../GlobalConstants";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Error from "next/error";
import { NextURL } from "next/dist/server/web/next-url";

export const formatDate = (date: string | Date | Dayjs): string => dayjs(date).format("L HH:mm");

export const formatDateForGrid = (value: any): string => dayjs(value).format();

export const getDummyId = (existingItems: any[]) =>
    existingItems?.length > 0
        ? existingItems
              .map((item: any) => item[GlobalConstants.ID])
              .sort((id1: string, id2: string) => id1.localeCompare(id2))
              .at(-1) + "+"
        : "+";

export const navigateToRoute = (
    router: AppRouterInstance,
    route: string[],
    searchParams: { [key: string]: string } = {},
) => {
    const url = new NextURL(`/${route.join("/")}`, window.location.origin);
    for (let [key, value] of Object.entries(searchParams)) {
        url.searchParams.set(key, value);
    }
    router.push(url.toString());
};

export const allowRedirectException = (error: Error & { digest?: string }) => {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
        throw error;
    }
};

export const formatPrice = (price: number): number => price / 100;
