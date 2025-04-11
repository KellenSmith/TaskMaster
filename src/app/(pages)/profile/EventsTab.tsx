"use client";

import { getUserEvents } from "../../lib/user-actions";
import React, { useEffect, useState } from "react";
import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useUserContext } from "../../context/UserContext";
import GlobalConstants from "../../GlobalConstants";
import { defaultActionState } from "../../ui/Datagrid";
import { useRouter } from "next/navigation";
import { formatDate, navigateToRoute } from "../../ui/utils";
import { isUserHost } from "../../lib/definitions";
import { isEventPublished } from "../calendar/[event-id]/event-utils";
const EventsTab: React.FC = () => {
    const { user } = useUserContext();
    const [events, setEvents] = useState<any[]>([]);
    const router = useRouter();

    const fetchEvents = async () => {
        const eventsData = await getUserEvents(user[GlobalConstants.ID], defaultActionState);
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
                                        Start Date: {formatDate(event[GlobalConstants.START_TIME])}
                                    </Typography>
                                    <Typography color="textSecondary">
                                        End Date: {formatDate(event[GlobalConstants.END_TIME])}
                                    </Typography>
                                </Stack>
                                <Stack spacing={2} direction="row" alignItems="center">
                                    {!isEventPublished(event) && (
                                        <Typography color="secondary" variant="button">
                                            draft
                                        </Typography>
                                    )}
                                    {isUserHost(user, event) && (
                                        <Typography color="secondary" variant="button">
                                            host
                                        </Typography>
                                    )}
                                    <Button
                                        size="small"
                                        onClick={() =>
                                            navigateToRoute(
                                                `${process.env.NEXT_PUBLIC_API_URL}/${GlobalConstants.CALENDAR}/${event[GlobalConstants.ID]}`,
                                                router,
                                            )
                                        }
                                    >
                                        visit
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                ))}
        </Stack>
    );
};

export default EventsTab;
