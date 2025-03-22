import dayjs, { Dayjs } from "dayjs";
import GlobalConstants from "../GlobalConstants";

export const formatDate = (date: string | Date | Dayjs): string => dayjs(date).format("L HH:mm");

export const getDummyId = (existingItems: any[]) =>
    existingItems?.length > 0
        ? existingItems
              .map((item: any) => item[GlobalConstants.ID])
              .sort((id1: string, id2: string) => id1.localeCompare(id2))
              .at(-1) + "+"
        : "+";
