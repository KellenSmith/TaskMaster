"use client";

import { Stack, Typography, useTheme } from "@mui/material";
import React from "react";
import GlobalConstants from "../../GlobalConstants";
import TextContent from "../../ui/TextContent";

const ContactPage: React.FC = () => {
    const theme = useTheme();

    return (
        <Stack sx={{ height: "100%", justifyContent: "center", alignItems: "center" }}>
            <Typography textAlign="center" color={theme.palette.text.primary} variant="h3">
                Contact
            </Typography>
            <TextContent id={GlobalConstants.CONTACT} richText={true} />
        </Stack>
    );
};

export default ContactPage;
