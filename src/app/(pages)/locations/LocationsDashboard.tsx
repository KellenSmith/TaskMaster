"use client";

import { Button, Dialog, Divider, Stack } from "@mui/material";
import { use, useState, useTransition } from "react";
import LocationCard from "./LocationCard";
import { Location } from "@prisma/client";
import Form from "../../ui/form/Form";
import GlobalConstants from "../../GlobalConstants";
import { LocationCreateSchema } from "../../lib/zod-schemas";
import { createLocation, deleteLocation, updateLocation } from "../../lib/location-actions";
import z from "zod";
import { useNotificationContext } from "../../context/NotificationContext";
import { RenderedFields } from "../../ui/form/FieldCfg";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";

interface LocationsDashboardProps {
    locationsPromise: Promise<Location[]>;
}

const LocationsDashboard = ({ locationsPromise }: LocationsDashboardProps) => {
    const { language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const locations = use(locationsPromise);
    const [editLocationId, setEditLocationId] = useState<string | null>(null);
    const [createNew, setCreateNew] = useState(false);
    const [isPending, startTransition] = useTransition();

    const createLocationAction = async (
        parsedFieldValues: z.infer<typeof LocationCreateSchema>,
    ) => {
        try {
            await createLocation(parsedFieldValues);
            setCreateNew(false);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const updateLocationAction = async (
        parsedFieldValues: z.infer<typeof LocationCreateSchema>,
    ) => {
        try {
            await updateLocation(editLocationId, parsedFieldValues);
            setEditLocationId(null);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const deleteLocationAction = async (locationId: string) => {
        startTransition(async () => {
            try {
                await deleteLocation(locationId);
                addNotification(GlobalLanguageTranslations.successfulDelete[language], "success");
            } catch {
                addNotification(GlobalLanguageTranslations.failedDelete[language], "error");
            }
        });
    };

    return (
        <Stack justifyContent="flex-start">
            <Button onClick={() => setCreateNew(true)}>
                {LanguageTranslations.addLocation[language]}
            </Button>
            <Stack spacing={2}>
                {locations
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((location) => (
                        <Stack key={location.id}>
                            <LocationCard
                                location={location}
                                renderedFields={RenderedFields[GlobalConstants.LOCATION]}
                            />
                            <Button
                                disabled={isPending}
                                onClick={() => setEditLocationId(location.id)}
                                fullWidth
                            >
                                {GlobalLanguageTranslations.edit[language]}
                            </Button>
                            <Button
                                fullWidth
                                color="error"
                                onClick={() => deleteLocationAction(location.id)}
                                disabled={isPending}
                            >
                                {GlobalLanguageTranslations.delete[language]}
                            </Button>
                            <Divider />
                        </Stack>
                    ))}
            </Stack>
            <Dialog
                open={!!editLocationId || createNew}
                onClose={() => {
                    setEditLocationId(null);
                    setCreateNew(false);
                }}
                fullWidth
            >
                <Form
                    name={GlobalConstants.LOCATION}
                    defaultValues={
                        editLocationId
                            ? locations.find((loc) => loc.id === editLocationId)
                            : undefined
                    }
                    validationSchema={LocationCreateSchema}
                    action={editLocationId ? updateLocationAction : createLocationAction}
                    editable={true}
                    readOnly={false}
                />
            </Dialog>
        </Stack>
    );
};

export default LocationsDashboard;
