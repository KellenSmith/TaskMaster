"use client";

import { Stack, Typography, useTheme } from "@mui/material";
import React from "react";

const Home: React.FC = () => {
    const theme = useTheme();
    return (
        <Stack sx={{ height: "100%", justifyContent: "center" }}>
            <Typography textAlign="center" color={theme.palette.text.primary} variant="h3">
                {`Welcome to ${process.env.NEXT_PUBLIC_ORG_NAME}`}
            </Typography>
            <Typography textAlign="center" color={theme.palette.text.primary} variant="h5">
                {`This site is under construction. Feel free to explore!`}
            </Typography>
        </Stack>
    );
};

export default Home;
