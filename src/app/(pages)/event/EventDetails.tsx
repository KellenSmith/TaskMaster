import { CalendarMonth, LocationOn, Person } from "@mui/icons-material";
import { Paper, Stack, Typography } from "@mui/material";
import { formatDate } from "../../ui/utils";
import RichTextField from "../../ui/form/RichTextField";
import { Prisma } from "@prisma/client";

interface EventDetailsProps {
    event: Prisma.EventGetPayload<{
        include: { host: { select: { id: true; nickname: true } } };
    }>;
}

const EventDetails = ({ event }: EventDetailsProps) => {
    return (
        <Stack spacing={3} sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <CalendarMonth color="primary" />
                        <Typography>
                            From:
                            <br />
                            To:
                        </Typography>
                        <Typography>
                            {formatDate(event.startTime)}
                            <br />
                            {formatDate(event.endTime)}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <LocationOn color="primary" />
                        <Typography>{event.location}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Person color="primary" />
                        <Typography>Host: {event.host.nickname}</Typography>
                    </Stack>
                    <RichTextField editMode={false} defaultValue={event.description} />
                </Stack>
            </Paper>
        </Stack>
    );
};

export default EventDetails;
