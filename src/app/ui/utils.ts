import dayjs, { Dayjs } from "dayjs";
import GlobalConstants from "../GlobalConstants";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useState } from "react";

export const formatDate = (date: string | Date | Dayjs): string => dayjs(date).format("L HH:mm");

export const getDummyId = (existingItems: any[]) =>
    existingItems?.length > 0
        ? existingItems
              .map((item: any) => item[GlobalConstants.ID])
              .sort((id1: string, id2: string) => id1.localeCompare(id2))
              .at(-1) + "+"
        : "+";

export const navigateToRoute = (route: string, router: AppRouterInstance) => {
    router.push(`${window.location.origin}${route}`);
};
