"use client";

import { Stack, Typography, useTheme } from "@mui/material";
import React from "react";
import GlobalConstants from "./GlobalConstants";
import TextContent from "./ui/TextContent";
import { useOrganizationSettingsContext } from "./context/OrganizationSettingsContext";

const Home: React.FC = () => {
    const theme = useTheme();
    const { organizationSettings } = useOrganizationSettingsContext();

    return (
        <Stack sx={{ height: "100%", justifyContent: "center", alignItems: "center" }}>
            <Typography textAlign="center" color={theme.palette.text.primary} variant="h3">
                {`Welcome to ${organizationSettings?.organizationName}`}
            </Typography>
            <TextContent id={GlobalConstants.HOME} richText={true} />
        </Stack>
    );
};

export default Home;
