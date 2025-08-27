"use client";

import { Prisma } from "@prisma/client";
import { use } from "react";
import { LocationOn } from "@mui/icons-material";
import { Box, Paper, Stack, Typography } from "@mui/material";
import RichTextField from "../../ui/form/RichTextField";

interface LocationDashboardProps {
    eventPromise: Promise<
        Prisma.EventGetPayload<{
            include: {
                location: true;
            };
        }>
    >;
}

const LocationDashboard = ({ eventPromise }: LocationDashboardProps) => {
    const event = use(eventPromise);
    const location = event.location;

    if (!location) {
        return (
            <Box sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    No location information available for this event.
                </Typography>
            </Box>
        );
    }

    return (
        <Stack spacing={3} sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <LocationOn color="primary" />
                        <Typography variant="h6" component="h3">
                            {location.name}
                        </Typography>
                    </Stack>

                    <Stack spacing={1}>
                        <Typography color="text.secondary">Address</Typography>
                        <Typography>{location.address}</Typography>
                    </Stack>

                    {location.accessibilityInfo && (
                        <Stack spacing={1}>
                            <Typography color="text.secondary">Accessibility</Typography>
                            <Typography>{location.accessibilityInfo}</Typography>
                        </Stack>
                    )}

                    {location.description && (
                        <RichTextField editMode={false} defaultValue={location.description} />
                    )}
                </Stack>
            </Paper>
        </Stack>
    );
};

export default LocationDashboard;
