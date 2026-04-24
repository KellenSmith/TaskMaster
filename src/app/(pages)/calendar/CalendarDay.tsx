"use client";

import { FC, use, useMemo, useCallback } from "react";
import { Paper, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import CalendarEvent from "./CalendarEvent";
import dayjs, { Dayjs } from "../../lib/dayjs";
import { useUserContext } from "../../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";
import { Prisma } from "../../../prisma/generated/browser";

interface CalendarDayProps {
    date: Dayjs;
    eventsPromise: Promise<Prisma.EventGetPayload<true>[]>;
}

const CalendarDay: FC<CalendarDayProps> = ({ date, eventsPromise }) => {
    const events = use(eventsPromise);
    const { language } = useUserContext();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const shouldShowEvent = useCallback(
        (event: Prisma.EventGetPayload<true>) => {
            // Show event if it starts or ends on the current day, or if it spans across the current day

            const eventStart = dayjs(event.start_time);
            const eventEnd = dayjs(event.end_time);

            return (
                eventStart.isSame(date, "day") ||
                eventEnd.isSame(date, "day") ||
                (eventStart.isBefore(date.startOf("day")) && eventEnd.isAfter(date.endOf("day")))
            );
        },
        [date],
    );

    const eventsForDay = useMemo(
        () => events.filter((event) => shouldShowEvent(event)),
        [events, shouldShowEvent],
    );

    const getEmptyDay = () => <Paper key={`empty-end-${date.date()}`} elevation={0} />;

    if (eventsForDay.length < 1 && isSmallScreen) return null;

    const getDayComp = () => {
        if (eventsForDay.length < 1) return getEmptyDay();
        return (
            <Stack spacing={0.5}>
                {eventsForDay
                    .sort((a, b) => dayjs(a.start_time).unix() - dayjs(b.start_time).unix())
                    .map((event) => (
                        <CalendarEvent key={event.id} event={event} />
                    ))}
            </Stack>
        );
    };

    const getDayName = () => {
        const weekdayIndex = (date.day() + 6) % 7; // map Sunday=0..Saturday=6 to Monday-first index 0..6
        return LanguageTranslations.weekDaysShort[language][weekdayIndex] ?? "";
    };

    return (
        <Paper sx={{ width: "100%", minHeight: { xs: 80, sm: "auto" } }}>
            <Stack spacing={1}>
                <Stack direction="row" alignItems="center">
                    {/* Localized short weekday (Monday-first) */}
                    <Typography padding={1} variant="subtitle2">
                        {`${date.format("D")}`}
                    </Typography>
                    {isSmallScreen && (
                        <Typography variant="subtitle2">{` - ${getDayName()}`}</Typography>
                    )}
                </Stack>
                {getDayComp()}
            </Stack>
        </Paper>
    );
};

export default CalendarDay;
