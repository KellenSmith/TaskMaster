import { SyntheticEvent } from "react";

import { Prisma } from "@prisma/client";
import { use, useState, useTransition } from "react";
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { isUserAdmin, isUserHost } from "../../lib/utils";
import { useUserContext } from "../../context/UserContext";
import LocationCard from "../locations/LocationCard";
import { FieldLabels, RenderedFields } from "../../ui/form/FieldCfg";
import GlobalConstants from "../../GlobalConstants";
import { useNotificationContext } from "../../context/NotificationContext";
import { updateEvent } from "../../lib/event-actions";
import { CustomOptionProps } from "../../ui/form/AutocompleteWrapper";
import LanguageTranslations from "./LanguageTranslations";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import CalendarLanguageTranslations from "../calendar/LanguageTranslations";

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
    const { user, language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const event = use(eventPromise);
    const location = event.location;
    const locations = use(locationsPromise);
    const [isPending, startTransition] = useTransition();
    const [selectedLocationOption, setSelectedLocationOption] = useState<CustomOptionProps>(
        location?.id ? { id: location.id, label: location.name } : null,
    );

    if (!location) {
        return (
            <Box sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    {LanguageTranslations.noLocationInfo[language]}
                </Typography>
            </Box>
        );
    }

    const getSelectedLocation = () =>
        locations.find((loc) => loc.id === selectedLocationOption.id) || location;

    const switchEventLocation = async () => {
        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append(GlobalConstants.LOCATION_ID, selectedLocationOption.id);
                await updateEvent(event.id, formData);
                addNotification(GlobalLanguageTranslations.successfulSave[language], "success");
            } catch {
                addNotification(GlobalLanguageTranslations.failedSave[language], "error");
            }
        });
    };

    const isSwitchButtonDisabled = () => {
        const selectedLocation = getSelectedLocation();
        if (event.max_participants > selectedLocation.capacity) {
            return true;
        }
        return false;
    };

    return (
        <Stack
            sx={{
                flexDirection: { xs: "column-reverse", sm: "row" },
                gap: 2,
                alignItems: "stretch",
            }}
        >
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <LocationCard
                    location={getSelectedLocation()}
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
            </Box>

            {(isUserAdmin(user) || isUserHost(user, event)) && locations.length > 1 && (
                <Card sx={{ width: { xs: "100%", sm: 360 }, flexShrink: 0 }}>
                    <CardContent sx={{ p: 2 }}>
                        <Autocomplete
                            fullWidth
                            value={selectedLocationOption}
                            onChange={(_: SyntheticEvent, newValue: CustomOptionProps | null) =>
                                setSelectedLocationOption(newValue)
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    fullWidth
                                    label={
                                        FieldLabels[GlobalConstants.LOCATION_ID][language] as string
                                    }
                                />
                            )}
                            options={locations.map((loc) => ({ id: loc.id, label: loc.name }))}
                            autoSelect
                            disabled={isPending}
                        />
                    </CardContent>
                    <Stack spacing={1} sx={{ p: 2 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            disabled={
                                isSwitchButtonDisabled() ||
                                selectedLocationOption.id === event.location_id
                            }
                            onClick={switchEventLocation}
                        >
                            {LanguageTranslations.switchEventLocation[language]}
                        </Button>
                        {isSwitchButtonDisabled() && (
                            <Typography
                                color="error"
                                textAlign="center"
                                sx={{ fontSize: "0.95rem" }}
                            >
                                {CalendarLanguageTranslations.locationCapacityExceeded[language](
                                    locations.find(
                                        (location) => location.id === selectedLocationOption.id,
                                    )?.capacity || 0,
                                )}
                            </Typography>
                        )}
                    </Stack>
                </Card>
            )}
        </Stack>
    );
};

export default LocationDashboard;
