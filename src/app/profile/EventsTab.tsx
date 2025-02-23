"use client";

import { getUserParticipantEvents } from "../lib/actions";
import React, { useEffect, useState } from "react";
import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useUserContext } from "../context/UserContext";
import GlobalConstants from "../GlobalConstants";
import { defaultActionState } from "../ui/Datagrid";
import dayjs from "dayjs";
import { redirect } from "next/navigation";
import { OrgSettings } from "../lib/org-settings";
const EventsTab: React.FC = () => {
    const { user } = useUserContext();
    const [events, setEvents] = useState<any[]>([]);

    const fetchEvents = async () => {
        const eventsData = await getUserParticipantEvents(
            user[GlobalConstants.ID],
            defaultActionState,
        );
        setEvents(eventsData.result);
    };

    useEffect(() => {
        fetchEvents();
        // Fetch events on first render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Stack>
            {events &&
                events.map((event) => (
                    <Card key={event.id} style={{ marginBottom: "16px" }}>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between">
                                <Stack>
                                    <Typography variant="h5" component="div">
                                        {event.title}
                                    </Typography>
                                    <Typography color="textSecondary">
                                        Start Date: {dayjs(event.startDate).format("L HH:MM")}
                                    </Typography>
                                    <Typography color="textSecondary">
                                        End Date: {dayjs(event.endDate).format("L HH:MM")}
                                    </Typography>
                                </Stack>
                                <Button
                                    size="small"
                                    onClick={() =>
                                        redirect(
                                            `${OrgSettings[GlobalConstants.BASE_URL]}/${GlobalConstants.CALENDAR}/${event[GlobalConstants.ID]}`,
                                        )
                                    }
                                >
                                    visit
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                ))}
        </Stack>
    );
};

export default EventsTab;
