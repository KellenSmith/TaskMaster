"use server";
import { getEventById, getEventParticipants, getEventReserves } from "../../lib/event-actions";
import { getEventTasks } from "../../lib/task-actions";
import { getActiveMembers, getLoggedInUser } from "../../lib/user-actions";
import { Suspense } from "react";
import { CircularProgress, Stack, Typography } from "@mui/material";
import EventDashboard from "./EventDashboard";
import { ErrorBoundary } from "react-error-boundary";
import { unstable_cache } from "next/cache";
import GlobalConstants from "../../GlobalConstants";
import { getEventTickets } from "../../lib/ticket-actions";

interface EventPageProps {
    searchParams: { [eventId: string]: string };
}

const EventPage = async ({ searchParams }: EventPageProps) => {
    const eventId = (await searchParams).eventId;

    const eventPromise = unstable_cache(getEventById, [eventId], {
        tags: [GlobalConstants.EVENT],
    })(eventId);
    const eventParticipantsPromise = unstable_cache(getEventParticipants, [eventId], {
        tags: [GlobalConstants.PARTICIPANT_USERS],
    })(eventId);
    const aventReservesPromise = unstable_cache(getEventReserves, [eventId], {
        tags: [GlobalConstants.RESERVE_USERS],
    })(eventId);
    const eventTasksPromise = unstable_cache(getEventTasks, [eventId], {
        tags: [GlobalConstants.TASK],
    })(eventId);
    const eventTicketsPromise = unstable_cache(getEventTickets, [eventId], {
        tags: [GlobalConstants.TICKET],
    })(eventId);
    const activeMembersPromise = unstable_cache(getActiveMembers, [], {
        tags: [GlobalConstants.USER],
    })();

    return (
        <ErrorBoundary
            fallback={<Typography color="primary">Sorry, we can't show this event</Typography>}
        >
            <Suspense fallback={<CircularProgress />}>
                <Stack spacing={2}>
                    <EventDashboard
                        eventPromise={eventPromise}
                        eventParticipantsPromise={eventParticipantsPromise}
                        eventReservesPromise={aventReservesPromise}
                        eventTasksPromise={eventTasksPromise}
                        eventTicketsPromise={eventTicketsPromise}
                        activeMembersPromise={activeMembersPromise}
                    />
                </Stack>
            </Suspense>
        </ErrorBoundary>
    );
};

export default EventPage;
