"use client";

import { Prisma } from "@prisma/client";
import { use, useState, useTransition } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { isUserAdmin, isUserHost } from "../../lib/definitions";
import { useUserContext } from "../../context/UserContext";
import LocationCard from "../locations/LocationCard";
import { RenderedFields } from "../../ui/form/FieldCfg";
import GlobalConstants from "../../GlobalConstants";
import { useNotificationContext } from "../../context/NotificationContext";
import { updateEvent } from "../../lib/event-actions";

interface LocationDashboardProps {
    eventPromise: Promise<
        Prisma.EventGetPayload<{
            include: {
                location: true;
            };
        }>
    >;
    locationsPromise: Promise<Prisma.LocationGetPayload<true>[]>;
}

const LocationDashboard = ({ eventPromise, locationsPromise }: LocationDashboardProps) => {
    const { user } = useUserContext();
    const { addNotification } = useNotificationContext();
    const event = use(eventPromise);
    const location = event.location;
    const locations = use(locationsPromise);
    const [selectedLocationId, setSelectedLocationId] = useState(location?.id || null);
    const [isPending, startTransition] = useTransition();

    if (!location) {
        return (
            <Box sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    No location information available for this event.
                </Typography>
            </Box>
        );
    }

    const switchEventLocation = () => {
        startTransition(async () => {
            try {
                await updateEvent(event.id, { locationId: selectedLocationId });
                addNotification("Switched event location", "success");
            } catch {
                addNotification("Failed to switch event location", "error");
            }
        });
    };

    return (
        <Stack direction="row" spacing={2}>
            <LocationCard
                location={locations.find((loc) => loc.id === selectedLocationId) || location}
                renderedFields={
                    isUserAdmin(user) || isUserHost(user, event)
                        ? RenderedFields[GlobalConstants.LOCATION]
                        : [
                              GlobalConstants.NAME,
                              GlobalConstants.ADDRESS,
                              GlobalConstants.ACCESSIBILITY_INFO,
                              GlobalConstants.DESCRIPTION,
                          ]
                }
            />
        </Stack>
    );
};

export default LocationDashboard;
