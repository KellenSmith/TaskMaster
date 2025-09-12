"use client";
import { Location } from "@prisma/client";
import { LocationOn } from "@mui/icons-material";
import { Paper, Stack, Typography } from "@mui/material";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { useUserContext } from "../../context/UserContext";
import GlobalConstants from "../../GlobalConstants";
import RichTextField from "../../ui/form/RichTextField";

interface LocationDashboardProps {
    location: Location;
    renderedFields: string[];
}

const LocationCard = ({ location, renderedFields }: LocationDashboardProps) => {
    const { language } = useUserContext();
    return (
        <Stack spacing={3} width="100%">
            <Paper elevation={3} sx={{ p: 3 }}>
                <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                            <LocationOn color="primary" />
                            <Typography variant="h6" component="h3">
                                {location.name}
                            </Typography>
                        </Stack>
                    </Stack>

                    {renderedFields.map((fieldId) => (
                        <Stack key={fieldId} spacing={1}>
                            <Typography color="text.secondary">
                                {FieldLabels[fieldId][language] as string}
                            </Typography>
                            {fieldId === GlobalConstants.DESCRIPTION ? (
                                <RichTextField
                                    editMode={false}
                                    defaultValue={location.description}
                                />
                            ) : (
                                <Typography>{location[fieldId]}</Typography>
                            )}
                        </Stack>
                    ))}
                </Stack>
            </Paper>
        </Stack>
    );
};

export default LocationCard;
