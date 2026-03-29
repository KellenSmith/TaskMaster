import * as colors from "@mui/material/colors";
import * as dayjs from "dayjs";
import { getSortedEvents, getTasksSortedByTime } from "../calendar-post/event-utils";
import CircleSector from "./CircleSector";
import { Prisma } from "../../../prisma/generated/client";

interface YearWheelEventProps {
    event: Prisma.EventGetPayload<{ include: { tasks: true } }>;
    events: Prisma.EventGetPayload<{ include: { tasks: true } }>[];
}

const YearWheelEvent = ({ event, events }: YearWheelEventProps) => {
    const getEarliestTaskStartTime = (ev: typeof event) => {
        const sortedTasks = getTasksSortedByTime(ev.tasks);
        return sortedTasks[0]?.start_time;
    };

    const getLatestTaskEndTime = (ev: typeof event) => {
        const sortedTasks = getTasksSortedByTime(ev.tasks);
        return sortedTasks.at(-1)?.end_time;
    };

    const getTotalDuration = (ev: typeof event) => {
        return (
            (dayjs
                .default(getLatestTaskEndTime(ev))
                .diff(dayjs.default(getEarliestTaskStartTime(ev)), "milliseconds") /
                (365 * 24 * 60 * 60 * 1000)) *
            100
        );
    };

    const totalDuration = getTotalDuration(event);
    const eventDuration =
        (dayjs.default(event.end_time).diff(dayjs.default(event.start_time), "milliseconds") /
            (365 * 24 * 60 * 60 * 1000)) *
        100;

    const taskStartOffset =
        (dayjs
            .default(getEarliestTaskStartTime(event))
            .diff(dayjs.default().startOf("year"), "milliseconds") /
            (365 * 24 * 60 * 60 * 1000)) *
        100;
    const eventStartOffset =
        (dayjs.default(event.start_time).diff(dayjs.default().startOf("year"), "milliseconds") /
            (365 * 24 * 60 * 60 * 1000)) *
        100;

    const overLappingEvents = getSortedEvents([
        event,
        ...events.filter((e) => {
            const earliestTaskStartTime = getEarliestTaskStartTime(e);
            const latestTaskEndTime = getLatestTaskEndTime(e);

            const currentEarliestTaskStartTime = getEarliestTaskStartTime(event);
            const currentLatestTaskEndTime = getLatestTaskEndTime(event);

            if (
                dayjs
                    .default(earliestTaskStartTime)
                    .isAfter(dayjs.default(currentEarliestTaskStartTime)) &&
                dayjs.default(latestTaskEndTime).isBefore(dayjs.default(currentLatestTaskEndTime))
            )
                return true;
            if (
                dayjs
                    .default(latestTaskEndTime)
                    .isAfter(dayjs.default(currentEarliestTaskStartTime)) &&
                dayjs.default(latestTaskEndTime).isBefore(dayjs.default(currentLatestTaskEndTime))
            )
                return true;
            return false;
        }),
    ]);

    // Ensure index is non-negative (fallback) then compute a logarithmic decrease
    // Start at 100% for index 0 and approach 50% as index grows.
    const safeIndex = Math.max(0, overLappingEvents.indexOf(event));
    const sizePercent = Math.min(100, Math.max(50, 50 + 50 / (1 + Math.log10(safeIndex + 1))));

    type ShadePalette = {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
        A100: string;
        A200: string;
        A400: string;
        A700: string;
    };

    const getColorShade = (): ShadePalette => {
        const shadeIndex = safeIndex % Object.keys(colors).length;
        return Object.values(colors)[shadeIndex] as ShadePalette;
    };

    return (
        <>
            <CircleSector
                arcLength={totalDuration}
                color={getColorShade()[300]}
                startOffset={taskStartOffset}
                radius={sizePercent / 2}
                zIndex={safeIndex}
            />
            <CircleSector
                arcLength={eventDuration}
                color={getColorShade()[500]}
                startOffset={eventStartOffset}
                radius={sizePercent / 2}
                zIndex={safeIndex + 1}
            />
        </>
    );
};

export default YearWheelEvent;
