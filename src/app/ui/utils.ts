import dayjs, { Dayjs } from "dayjs";

export const formatDate = (date: string | Date | Dayjs): string => dayjs(date).format("L HH:mm");
