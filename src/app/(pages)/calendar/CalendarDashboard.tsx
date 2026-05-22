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
import { utcDateToTzDate } from "../../context/LocalizationContext";

interface CalendarDashboardProps {
    eventsPromise: Promise<Prisma.EventGetPayload<true>[]>;
    locationsPromise: Promise<Prisma.LocationGetPayload<true>[]>;
}

const CalendarDashboard: FC<CalendarDashboardProps> = ({ eventsPromise, locationsPromise }) => {
    const { user, language } = useUserContext();
    const [selectedTzDate, setSelectedTzDate] = useState(
        utcDateToTzDate(dayjs.utc()).startOf("day").date(1),
    );
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

    const getDaysInFirstTzWeekButNotInMonth = () => {
        const firstDayOfMonth = selectedTzDate.startOf("day");
        const firstDayOfFirstWeekInMonth = firstDayOfMonth.startOf("week");
        const dayDiff = firstDayOfMonth.diff(firstDayOfFirstWeekInMonth, "day");
        const daysInFirstWeekButNotInMonth = [];
        for (let i = 0; i < dayDiff; i++) {
            daysInFirstWeekButNotInMonth.push(firstDayOfFirstWeekInMonth.add(i, "d"));
        }
        return daysInFirstWeekButNotInMonth;
    };

    const getDaysInLastTzWeekButNotInMonth = () => {
        const lastDayOfSelectedMonth = selectedTzDate.endOf("month").startOf("day");
        const lastDayOfLastWeekInMonth = lastDayOfSelectedMonth.endOf("week");
        const dayDiff = lastDayOfLastWeekInMonth.diff(lastDayOfSelectedMonth, "day");
        const daysInLastWeekButNotInMonth = [];
        for (let i = 1; i <= dayDiff; i++) {
            daysInLastWeekButNotInMonth.push(lastDayOfSelectedMonth.add(i, "d"));
        }
        return daysInLastWeekButNotInMonth;
    };

    const getDaysOfTzMonth = () => {
        const daysInMonth = [];
        const daysInSelectedMonth = selectedTzDate.daysInMonth();
        for (let i = 0; i < daysInSelectedMonth; i++) {
            daysInMonth.push(selectedTzDate.add(i, "d"));
        }
        return daysInMonth;
    };

    const getTzDaysToShow = () => [
        ...getDaysInFirstTzWeekButNotInMonth(),
        ...getDaysOfTzMonth(),
        ...getDaysInLastTzWeekButNotInMonth(),
    ];

    const getTzCalendarGrid = () => {
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
                    {getTzDaysToShow().map((tzDate) => (
                        <Grid key={tzDate.format("YYYY-MM-DD")} size={1}>
                            <CalendarDay tzDate={tzDate} eventsPromise={eventsPromise} />
                        </Grid>
                    ))}
                </Grid>
            </Stack>
        );
    };

    console.warn(
        "CalendarDashboard is rendering",
        events.map((e) => [e.title, e.start_time, e.end_time]),
    );

    const getTzCalendarList = () => {
        const days = getDaysOfTzMonth();
        return (
            <Stack spacing={2} sx={{ width: "100%" }}>
                {days.map((tzDate) => (
                    <CalendarDay
                        key={tzDate.format("YYYY-MM-DD")}
                        tzDate={tzDate}
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
                                onClick={() =>
                                    setSelectedTzDate((prev) => prev.subtract(1, "month"))
                                }
                                size={isSmallScreen ? "small" : "medium"}
                            >
                                <ArrowLeft />
                            </Button>
                            <Typography
                                color="primary"
                                alignSelf="center"
                                variant={isSmallScreen ? "h6" : "h4"}
                            >
                                {utcDateToTzDate(selectedTzDate).format("YYYY/MM")}
                            </Typography>
                            <Button
                                onClick={() => setSelectedTzDate((prev) => prev.add(1, "month"))}
                            >
                                <ArrowRight />
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>
                {(() => (isSmallScreen ? getTzCalendarList() : getTzCalendarGrid()))()}
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
