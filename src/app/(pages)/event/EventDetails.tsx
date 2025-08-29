import { CalendarMonth, LocationOn } from "@mui/icons-material";
import { Paper, Stack, Typography } from "@mui/material";
import { formatDate } from "../../ui/utils";
import RichTextField from "../../ui/form/RichTextField";
import { Prisma } from "@prisma/client";
import { use } from "react";
import LanguageTranslations from "./LanguageTranslations";
import { useUserContext } from "../../context/UserContext";

interface EventDetailsProps {
    eventPromise: Promise<Prisma.EventGetPayload<{ include: { location: true } }>>;
}

const EventDetails = ({ eventPromise }: EventDetailsProps) => {
    const { language } = useUserContext();
    const event = use(eventPromise);
    return (
        <Stack spacing={3} sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <CalendarMonth color="primary" />
                        <Typography>
                            {LanguageTranslations.start[language]}:
                            <br />
                            {LanguageTranslations.end[language]}:
                        </Typography>
                        <Typography>
                            {formatDate(event.start_time)}
                            <br />
                            {formatDate(event.end_time)}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <LocationOn color="primary" />
                        <Typography>
                            {event.location.name}, {event.location.address}
                        </Typography>
                    </Stack>
                    <RichTextField editMode={false} defaultValue={event.description} />
                </Stack>
            </Paper>
        </Stack>
    );
};

export default EventDetails;
