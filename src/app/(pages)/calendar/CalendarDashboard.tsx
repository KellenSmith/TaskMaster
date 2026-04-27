"use client";

import { FC, use, useState } from "react";
import {
    Stack,
    Typography,
    Button,
    Grid,
    Dialog,
    DialogContent,
    useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import CalendarDay from "./CalendarDay";
import { ArrowLeft, ArrowRight } from "@mui/icons-material";
import Form from "../../ui/form/Form";
import GlobalConstants from "../../GlobalConstants";
import { useUserContext } from "../../context/UserContext";
import { EventCreateSchema } from "../../lib/zod-schemas";
import { CustomOptionProps } from "../../ui/form/AutocompleteWrapper";
import LanguageTranslations from "./LanguageTranslations";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import { allowRedirectException } from "../../ui/utils";
import { stringsToSelectOptions } from "../../ui/form/FieldCfg";
import { createEvent } from "../../lib/event-actions";
import { Prisma } from "../../../prisma/generated/browser";

interface CalendarDashboardProps {
    eventsPromise: Promise<Prisma.EventGetPayload<true>[]>;
    locationsPromise: Promise<Prisma.LocationGetPayload<true>[]>;
}

const CalendarDashboard: FC<CalendarDashboardProps> = ({ eventsPromise, locationsPromise }) => {
    const { user, language } = useUserContext();
    const [selectedDate, setSelectedDate] = useState(dayjs().startOf("day").date(1));
    const [createOpen, setCreateOpen] = useState(false);
    const locations = use(locationsPromise);
    const events = use(eventsPromise);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const createEventWithHostAndTicket = async (formData: FormData) => {
        const selectedLocation = locations.find(
            (loc) => loc.id === formData.get(GlobalConstants.LOCATION_ID),
        );
        if (!selectedLocation) throw new Error(LanguageTranslations.locationNotFound[language]);
        if (!user) throw new Error("You must be logged in to create an event");

        if (
            !selectedLocation ||
            selectedLocation.capacity <
                parseInt(formData.get(GlobalConstants.MAX_PARTICIPANTS) as string)
        )
            throw new Error(
                LanguageTranslations.locationCapacityExceeded[language](selectedLocation.capacity),
            );

        try {
            await createEvent(formData);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch (error) {
            allowRedirectException(error);
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const getDaysInFirstWeekButNotInMonth = () => {
        const firstDayOfMonth = selectedDate.startOf("day");
        const firstDayOfFirstWeekInMonth = firstDayOfMonth.startOf("week");
        const dayDiff = firstDayOfMonth.diff(firstDayOfFirstWeekInMonth, "day");
        const daysInFirstWeekButNotInMonth = [];
        for (let i = 0; i < dayDiff; i++) {
            daysInFirstWeekButNotInMonth.push(firstDayOfFirstWeekInMonth.add(i, "d"));
        }
        return daysInFirstWeekButNotInMonth;
    };

    const getDaysInLastWeekButNotInMonth = () => {
        const lastDayOfSelectedMonth = selectedDate.endOf("month").startOf("day");
        const lastDayOfLastWeekInMonth = lastDayOfSelectedMonth.endOf("week");
        const dayDiff = lastDayOfLastWeekInMonth.diff(lastDayOfSelectedMonth, "day");
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
            <Stack sx={{ width: "100%" }}>
                <Grid container spacing={2} columns={7}>
                    {LanguageTranslations.weekDaysShort[language].map((day) => (
                        <Grid key={day} size={1} alignContent="center">
                            <Typography
                                key={day}
                                variant="subtitle2"
                                sx={{ textAlign: "center", color: "text.secondary" }}
                            >
                                {day}
                            </Typography>
                        </Grid>
                    ))}
                    {getDaysToShow().map((date) => (
                        <Grid key={date.format("YYYY-MM-DD")} size={1}>
                            <CalendarDay date={date} eventsPromise={eventsPromise} />
                        </Grid>
                    ))}
                </Grid>
            </Stack>
        );
    };

    const getCalendarList = () => {
        const days = getDaysOfMonth();
        return (
            <Stack spacing={2} sx={{ width: "100%" }}>
                {days.map((date) => (
                    <CalendarDay
                        key={date.format("YYYY-MM-DD")}
                        date={date}
                        eventsPromise={eventsPromise}
                    />
                ))}
            </Stack>
        );
    };

    const getLocationOptions = (): CustomOptionProps[] =>
        locations.map((location) => ({
            id: location.id,
            label: location.name,
        }));

    return (
        <>
            <Stack sx={{ width: "100%" }} padding={isSmallScreen ? 2 : 4}>
                <Stack direction="row" justifyContent="center">
                    <Stack direction="row" width="100%" justifyContent="space-between">
                        {user && (
                            <Button
                                size={isSmallScreen ? "small" : "medium"}
                                onClick={() => setCreateOpen(true)}
                            >
                                {LanguageTranslations.createEvent[language]}
                            </Button>
                        )}
                        <Stack direction="row">
                            <Button
                                onClick={() => setSelectedDate((prev) => prev.subtract(1, "month"))}
                                size={isSmallScreen ? "small" : "medium"}
                            >
                                <ArrowLeft />
                            </Button>
                            <Typography
                                color="primary"
                                alignSelf="center"
                                variant={isSmallScreen ? "h6" : "h4"}
                            >
                                {selectedDate.format("YYYY/MM")}
                            </Typography>
                            <Button onClick={() => setSelectedDate((prev) => prev.add(1, "month"))}>
                                <ArrowRight />
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>
                {(() => (isSmallScreen ? getCalendarList() : getCalendarGrid()))()}
            </Stack>
            <Dialog
                fullWidth
                fullScreen={isSmallScreen}
                maxWidth={isSmallScreen ? "sm" : "xl"}
                open={createOpen}
                onClose={() => setCreateOpen(false)}
            >
                <DialogContent>
                    <Form
                        name={GlobalConstants.EVENT}
                        buttonLabel={LanguageTranslations.createEventDraft[language]}
                        action={createEventWithHostAndTicket}
                        validationSchema={EventCreateSchema}
                        customOptions={{
                            [GlobalConstants.LOCATION_ID]: getLocationOptions(),
                            [GlobalConstants.TAGS]: stringsToSelectOptions([
                                ...new Set(events.flatMap((e) => e.tags || [])),
                            ]),
                        }}
                        readOnly={false}
                        editable={false}
                    />
                </DialogContent>
                <Button fullWidth onClick={() => setCreateOpen(false)}>
                    {GlobalLanguageTranslations.cancel[language]}
                </Button>
            </Dialog>
        </>
    );
};

export default CalendarDashboard;
