"use client";
import {
    Stack,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Button,
} from "@mui/material";

import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import { use, useState, useRef, PointerEvent } from "react";
import YearWheelEvent from "./YearWheelEvent";
import YearWheelMarker from "./YearWheelMarker";
import { formatDate, openResourceInNewTab } from "../../ui/utils";
import { ArrowLeft, ArrowRight, OpenInNew } from "@mui/icons-material";
import { getRelativeUrl } from "../../lib/utils";
import GlobalConstants from "../../GlobalConstants";
import { useUserContext } from "../../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";
import { getSortedEvents } from "../calendar-post/event-utils";

interface YearWheelDashboardProps {
    eventsPromise: Promise<Prisma.EventGetPayload<{ include: { tasks: true } }>[]>;
}

const YearWheelDashboard = ({ eventsPromise }: YearWheelDashboardProps) => {
    const { language } = useUserContext();
    const events = use(eventsPromise);
    const [displayStartTime, setDisplayStartTime] = useState(dayjs.utc().startOf("year"));
    const [markerDate, setMarkerDate] = useState(dayjs.utc());

    const getSortedAndFilteredEvents = () => {
        return getSortedEvents(events).filter((event) => {
            if (dayjs.utc(event.start_time).isSame(displayStartTime, "year")) return true;
            if (dayjs.utc(event.end_time).isSame(displayStartTime, "year")) return true;
            if (
                event.tasks.some(
                    (task) =>
                        dayjs.utc(task.start_time).isSame(displayStartTime, "year") ||
                        dayjs.utc(task.end_time).isSame(displayStartTime, "year"),
                )
            )
                return true;
            return false;
        });
    };

    const containerRef = useRef<HTMLDivElement | null>(null);

    const onContainerPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        // Allow clicking anywhere on the wheel to move the marker
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = (angleRad * (180 / Math.PI) - 270 + 360) % 360;

        const startOfYear = dayjs.utc(displayStartTime).startOf("year");
        const msInYear = dayjs.utc(startOfYear).add(1, "year").diff(startOfYear, "millisecond");
        const newMs = (angleDeg / 360) * msInYear;
        setMarkerDate(startOfYear.add(newMs, "millisecond"));
    };

    const getEventsAtMarker = () => {
        const md = markerDate;
        return getSortedEvents(events).filter((event) => {
            const evStart = dayjs.utc(event.start_time);
            const evEnd = dayjs.utc(event.end_time);

            // inclusive range check for the event itself
            if (
                md.isSame(evStart) ||
                md.isSame(evEnd) ||
                (md.isAfter(evStart) && md.isBefore(evEnd))
            )
                return true;

            // or any of the event's tasks overlap the marker
            if (
                event.tasks.some((task) => {
                    const tStart = dayjs.utc(task.start_time);
                    const tEnd = dayjs.utc(task.end_time);
                    return (
                        md.isSame(tStart) ||
                        md.isSame(tEnd) ||
                        (md.isAfter(tStart) && md.isBefore(tEnd))
                    );
                })
            )
                return true;

            return false;
        });
    };

    return (
        <Stack direction="row" sx={{ width: "100%", height: "100%" }}>
            <Stack direction="row" height="fit-content">
                <Button onClick={() => setDisplayStartTime((prev) => prev.subtract(1, "year"))}>
                    <ArrowLeft />
                </Button>
                <Typography color="primary" alignSelf="center" variant="h4">
                    {displayStartTime.format("YYYY")}
                </Typography>
                <Button onClick={() => setDisplayStartTime((prev) => prev.add(1, "year"))}>
                    <ArrowRight />
                </Button>
            </Stack>
            <Stack
                sx={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                ref={containerRef}
                onPointerDown={onContainerPointerDown}
            >
                {getSortedAndFilteredEvents().map((event) => (
                    <YearWheelEvent key={event.id} event={event} events={events} />
                ))}
                {/* Marker rendered on top of all rings */}
                <YearWheelMarker
                    containerRef={containerRef}
                    markerDate={markerDate}
                    setMarkerDate={setMarkerDate}
                    displayStartTime={displayStartTime}
                    zIndex={events.length * 2 + 1}
                />
            </Stack>
            <Stack sx={{ width: "25%", p: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                    {LanguageTranslations.currentEvents[language]} —{" "}
                    {markerDate.format("YYYY/MM/DD")}
                </Typography>
                <List dense sx={{ maxHeight: 220, overflow: "auto" }}>
                    {getEventsAtMarker().length === 0 ? (
                        <ListItem>
                            <ListItemText primary="No events at this time" />
                        </ListItem>
                    ) : (
                        getEventsAtMarker().map((ev) => (
                            <ListItem
                                sx={{ justifyContent: "space-between", alignItems: "center" }}
                                key={ev.id}
                                divider
                            >
                                <ListItemText
                                    primary={ev.title}
                                    secondary={`${formatDate(ev.start_time)} — ${formatDate(ev.end_time)}`}
                                />
                                <ListItemIcon
                                    sx={{ cursor: "pointer", justifyContent: "flex-end" }}
                                    onClick={() =>
                                        openResourceInNewTab(
                                            getRelativeUrl([GlobalConstants.CALENDAR_POST], {
                                                [GlobalConstants.EVENT_ID]: ev.id,
                                            }),
                                        )
                                    }
                                >
                                    <OpenInNew />
                                </ListItemIcon>
                            </ListItem>
                        ))
                    )}
                </List>
            </Stack>
        </Stack>
    );
};

export default YearWheelDashboard;
