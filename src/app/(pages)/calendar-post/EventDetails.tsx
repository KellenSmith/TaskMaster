import { CalendarMonth, LocationOn } from "@mui/icons-material";
import { Paper, Stack, Typography, Box, Chip, useTheme, useMediaQuery } from "@mui/material";
import { formatDate } from "../../ui/utils";
import RichTextField from "../../ui/form/RichTextField";
import { Prisma } from "@prisma/client";
import { use } from "react";
import LanguageTranslations from "./LanguageTranslations";
import { taskFieldLabels } from "../../ui/form/LanguageTranslations";
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
                    <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
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
                        {event.tags && event.tags.length > 0 && (
                            <Box>
                                <Typography
                                    sx={{
                                        fontSize: { xs: "0.85rem", sm: "1rem" },
                                        color: "text.secondary",
                                        mb: 0.5,
                                    }}
                                >
                                    {taskFieldLabels["tags"][language] || "Tags"}
                                </Typography>
                                <TagChips tags={event.tags} />
                            </Box>
                        )}
                    </Stack>
                    <RichTextField editMode={false} defaultValue={event.description} />
                </Stack>
            </Paper>
        </Stack>
    );
};

const TagChips = ({ tags }: { tags: string[] }) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <Box role="list" sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            {tags.map((t) => (
                <Chip
                    role="listitem"
                    key={t}
                    label={t}
                    size={isSmallScreen ? "small" : "medium"}
                    variant="outlined"
                />
            ))}
        </Box>
    );
};

export default EventDetails;
