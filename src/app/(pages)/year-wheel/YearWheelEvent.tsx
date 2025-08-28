import * as colors from "@mui/material/colors";
import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import { getTasksSortedByTime } from "../event/event-utils";
import CircleSector from "./CircleSector";

interface YearWheelEventProps {
    event: Prisma.EventGetPayload<{ include: { tasks: true } }>;
    sizePercent: number;
    index: number;
}

const YearWheelEvent = ({ event, sizePercent, index }: YearWheelEventProps) => {
    const sortedEventTasks = getTasksSortedByTime(event.tasks);
    const earliestTaskStartTime = sortedEventTasks[0]?.start_time;
    const latestTaskEndTime = sortedEventTasks.at(-1)?.end_time;
    const totalDuration =
        (dayjs(latestTaskEndTime).diff(dayjs(earliestTaskStartTime), "milliseconds") /
            (365 * 24 * 60 * 60 * 1000)) *
        100;
    const eventDuration =
        (dayjs(event.end_time).diff(dayjs(event.start_time), "milliseconds") /
            (365 * 24 * 60 * 60 * 1000)) *
        100;
    const taskStartOffset =
        (dayjs(earliestTaskStartTime).diff(dayjs().startOf("year"), "milliseconds") /
            (365 * 24 * 60 * 60 * 1000)) *
        100;
    const eventStartOffset =
        (dayjs(event.start_time).diff(dayjs().startOf("year"), "milliseconds") /
            (365 * 24 * 60 * 60 * 1000)) *
        100;

    const getColorShade = () => {
        // Pick the shade according to index. When colors run out, start again on the first color
        const shadeIndex = index % Object.keys(colors).length;
        return Object.values(colors)[shadeIndex];
    };

    return (
        <>
            <CircleSector
                arcLength={totalDuration}
                color={getColorShade()[300]}
                startOffset={taskStartOffset}
                radius={sizePercent / 2}
                zIndex={index}
            />
            <CircleSector
                arcLength={eventDuration}
                color={getColorShade()[500]}
                startOffset={eventStartOffset}
                radius={sizePercent / 2}
                zIndex={index + 1}
            />
        </>
    );
};

export default YearWheelEvent;
