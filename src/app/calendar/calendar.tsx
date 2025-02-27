"use client";

import React, { FC, startTransition, useActionState, useEffect, useState } from "react";
import {
    Stack,
    Typography,
    CircularProgress,
    Button,
    Grid2,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
} from "@mui/material";
import dayjs from "dayjs";
import CalendarDay from "./calendar-day";
import { defaultActionState } from "../ui/Datagrid";
import { createEvent, getAllEvents } from "../lib/event-actions";
import localeData from "dayjs/plugin/localeData";
import { ArrowLeft, ArrowRight } from "@mui/icons-material";
import Form, { FormActionState } from "../ui/form/Form";
import GlobalConstants from "../GlobalConstants";
import { useUserContext } from "../context/UserContext";
import { Prisma } from "@prisma/client";
// import localeData from 'dayjs/plugin/localeData' // ES 2015

dayjs.extend(localeData);

const CalendarDashboard: FC = () => {
    const { user } = useUserContext();
    const theme = useTheme();
    const [selectedDate, setSelectedDate] = useState(dayjs().date(1));
    const [fetchEventsState, fetchEventsAction, isEventsPending] = useActionState(
        getAllEvents,
        defaultActionState,
    );
    const [createOpen, setCreateOpen] = useState(false);

    const createEventWithHost = async (
        currentActionState: FormActionState,
        fieldValues: Prisma.EventCreateInput,
    ) => {
        const createEventResult = await createEvent(user.id, currentActionState, fieldValues);
        startTransition(async () => {
            fetchEventsAction();
        });

        return createEventResult;
    };

    // Fetch data on first render
    useEffect(() => {
        startTransition(async () => {
            fetchEventsAction();
        });
        // Disable lint to only fetch data on first render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getDaysInFirstWeekButNotInMonth = () => {
        const firstDayOfFirstWeekInMonth = selectedDate.startOf("week");
        const dayDiff = selectedDate.diff(firstDayOfFirstWeekInMonth, "day", true);
        const daysInFirstWeekButNotInMonth = [];
        for (let i = 0; i < dayDiff - 1; i++) {
            daysInFirstWeekButNotInMonth.push(firstDayOfFirstWeekInMonth.add(i, "d"));
        }
        return daysInFirstWeekButNotInMonth;
    };

    const getDaysInLastWeekButNotInMonth = () => {
        const lastDayOfSelectedMonth = selectedDate.endOf("month");
        const lastDayOfLastWeekInMonth = lastDayOfSelectedMonth.endOf("week");
        const dayDiff = lastDayOfLastWeekInMonth.diff(lastDayOfSelectedMonth, "day", true);
        const daysInLastWeekButNotInMonth = [];
        for (let i = 1; i <= dayDiff; i++) {
            daysInLastWeekButNotInMonth.push(lastDayOfSelectedMonth.add(i, "d"));
        }
        return daysInLastWeekButNotInMonth;
    };

    const getDaysOfMonth = () => {
        const daysInMonth = [];
        const daysInSelectedMonth = selectedDate.daysInMonth();
        for (let i = 0; i < daysInSelectedMonth; i++) {
            daysInMonth.push(selectedDate.add(i, "d"));
        }
        return daysInMonth;
    };

    const getDaysToShow = () => [
        ...getDaysInFirstWeekButNotInMonth(),
        ...getDaysOfMonth(),
        ...getDaysInLastWeekButNotInMonth(),
    ];

    const getCalendarGrid = () => {
        return (
            <Stack sx={{ height: "100%", width: "100%" }}>
                <Grid2 container spacing={2} columns={7} sx={{ height: "100%" }}>
                    {dayjs.weekdaysShort().map((day) => (
                        <Grid2 key={day} size={1} alignContent="center">
                            <Typography
                                key={day}
                                variant="subtitle2"
                                sx={{ textAlign: "center", color: "text.secondary" }}
                            >
                                {day}
                            </Typography>
                        </Grid2>
                    ))}
                    {getDaysToShow().map((date) => (
                        <Grid2 key={date.format("YYYY-MM-DD")} size={1}>
                            <CalendarDay date={date} events={fetchEventsState.result} />
                        </Grid2>
                    ))}
                </Grid2>
            </Stack>
        );
    };

    return (
        <>
            <Stack sx={{ height: "100%" }} padding={4}>
                <Stack direction="row" justifyContent="center">
                    <Stack direction="row" width="100%" justifyContent="space-between">
                        {user && <Button onClick={() => setCreateOpen(true)}>create event</Button>}
                        <Stack direction="row">
                            <Button
                                onClick={() => setSelectedDate((prev) => prev.subtract(1, "month"))}
                            >
                                <ArrowLeft />
                            </Button>
                            <Typography
                                color={theme.palette.text.secondary}
                                alignSelf="center"
                                variant="h4"
                            >
                                {selectedDate.format("MMMM YYYY")}
                            </Typography>
                            <Button onClick={() => setSelectedDate((prev) => prev.add(1, "month"))}>
                                <ArrowRight />
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>
                {isEventsPending ? <CircularProgress size={30} /> : getCalendarGrid()}
            </Stack>
            <Dialog maxWidth="xl" open={createOpen} onClose={() => setCreateOpen(false)}>
                <DialogTitle>Create event</DialogTitle>
                <DialogContent>
                    <Form
                        name={GlobalConstants.EVENT}
                        buttonLabel={GlobalConstants.CREATE}
                        action={createEventWithHost}
                    />
                </DialogContent>
            </Dialog>{" "}
        </>
    );
};

export default CalendarDashboard;
