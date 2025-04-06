"use client";

import { Stack, Typography, useTheme } from "@mui/material";
import React from "react";

const Home: React.FC = () => {
    const theme = useTheme();
    return (
        <Stack sx={{ height: "100%" }}>
            <Typography textAlign="center" color={theme.palette.text.primary} variant="h1">
                {`Welcome to ${process.env.NEXT_PUBLIC_ORG_NAME}`}
            </Typography>
        </Stack>
    );
};

export default Home;
