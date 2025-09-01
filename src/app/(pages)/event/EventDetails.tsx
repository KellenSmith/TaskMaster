import { CalendarMonth, LocationOn } from "@mui/icons-material";
import { Paper, Stack, Typography, Box } from "@mui/material";
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
        <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack spacing={2}>
                    {/* Dates and location - stack vertically on small screens */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
                    >
                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: "center", minWidth: 0, flex: 1 }}
                        >
                            <CalendarMonth color="primary" />
                            <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                <Typography
                                    sx={{
                                        fontSize: { xs: "0.85rem", sm: "1rem" },
                                        color: "text.secondary",
                                    }}
                                >
                                    {LanguageTranslations.start[language]}:
                                    <br />
                                    {LanguageTranslations.end[language]}:
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                <Typography
                                    sx={{
                                        fontSize: { xs: "0.85rem", sm: "1rem" },
                                        fontWeight: 500,
                                        overflowWrap: "anywhere",
                                    }}
                                >
                                    {formatDate(event.start_time)}
                                    <br />
                                    {formatDate(event.end_time)}
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: "center", minWidth: 0 }}
                        >
                            <LocationOn color="primary" />
                            <Typography
                                sx={{
                                    fontSize: { xs: "0.85rem", sm: "1rem" },
                                    overflowWrap: "anywhere",
                                }}
                            >
                                {event.location.name}, {event.location.address}
                            </Typography>
                        </Stack>
                    </Stack>
                    <RichTextField editMode={false} defaultValue={event.description} />
                </Stack>
            </Paper>
        </Stack>
    );
};

export default EventDetails;
