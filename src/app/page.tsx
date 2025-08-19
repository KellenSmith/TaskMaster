import { Stack, Typography } from "@mui/material";
import React from "react";
import GlobalConstants from "./GlobalConstants";
import { prisma } from "../prisma/prisma-client";
import TextContent from "./ui/TextContent";

const Home: React.FC = async () => {
    const organizationSettings = await prisma.organizationSettings.findFirst();

    return (
        <Stack sx={{ height: "100%", justifyContent: "center", alignItems: "center" }}>
            <Typography textAlign="center" color="primary" variant="h3">
                {`Welcome to ${organizationSettings?.organizationName}`}
            </Typography>
            <TextContent id={GlobalConstants.HOME} />
        </Stack>
    );
};

export default Home;
