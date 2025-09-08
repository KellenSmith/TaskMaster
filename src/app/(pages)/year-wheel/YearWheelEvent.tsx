import * as colors from "@mui/material/colors";
import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import { getSortedEvents, getTasksSortedByTime } from "../calendar-post/event-utils";
import CircleSector from "./CircleSector";

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
            (dayjs(getLatestTaskEndTime(ev)).diff(
                dayjs(getEarliestTaskStartTime(ev)),
                "milliseconds",
            ) /
                (365 * 24 * 60 * 60 * 1000)) *
            100
        );
    };

    const totalDuration = getTotalDuration(event);
    const eventDuration =
        (dayjs(event.end_time).diff(dayjs(event.start_time), "milliseconds") /
            (365 * 24 * 60 * 60 * 1000)) *
        100;

    const taskStartOffset =
        (dayjs(getEarliestTaskStartTime(event)).diff(dayjs().startOf("year"), "milliseconds") /
            (365 * 24 * 60 * 60 * 1000)) *
        100;
    const eventStartOffset =
        (dayjs(event.start_time).diff(dayjs().startOf("year"), "milliseconds") /
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
                dayjs(earliestTaskStartTime).isAfter(dayjs(currentEarliestTaskStartTime)) &&
                dayjs(latestTaskEndTime).isBefore(dayjs(currentLatestTaskEndTime))
            )
                return true;
            if (
                dayjs(latestTaskEndTime).isAfter(dayjs(currentEarliestTaskStartTime)) &&
                dayjs(latestTaskEndTime).isBefore(dayjs(currentLatestTaskEndTime))
            )
                return true;
            return false;
        }),
    ]);

    // Ensure index is non-negative (fallback) then compute a logarithmic decrease
    // Start at 100% for index 0 and approach 50% as index grows.
    const safeIndex = Math.max(0, overLappingEvents.indexOf(event));
    const sizePercent = Math.min(100, Math.max(50, 50 + 50 / (1 + Math.log10(safeIndex + 1))));

    const getColorShade = () => {
        // Pick the shade according to index. When colors run out, start again on the first color
        const shadeIndex = safeIndex % Object.keys(colors).length;
        return Object.values(colors)[shadeIndex];
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
