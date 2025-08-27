"use client";
import { Location } from "@prisma/client";
import { LocationOn } from "@mui/icons-material";
import { Paper, Stack, Typography } from "@mui/material";
import { FieldLabels, RenderedFields } from "../../ui/form/FieldCfg";
import GlobalConstants from "../../GlobalConstants";

interface LocationDashboardProps {
    location: Location;
    setEditLocationId: (id: string | null) => void;
}

const LocationCard = ({ location }: LocationDashboardProps) => {
    return (
        <Stack spacing={3}>
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

                    {RenderedFields[GlobalConstants.LOCATION].map((fieldId) => (
                        <Stack key={fieldId} spacing={1}>
                            <Typography color="text.secondary">{FieldLabels[fieldId]}</Typography>
                            <Typography>{location[fieldId]}</Typography>
                        </Stack>
                    ))}
                </Stack>
            </Paper>
        </Stack>
    );
};

export default LocationCard;
