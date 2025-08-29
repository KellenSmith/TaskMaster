import { Stack } from "@mui/material";
import React from "react";
import GlobalConstants from "./GlobalConstants";
import TextContent from "./ui/TextContent";
import { Prisma } from "@prisma/client";

interface HomeDashboardProps {
    textContentPromise: Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>>;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ textContentPromise }) => {
    return (
        <Stack sx={{ height: "100%", justifyContent: "center", alignItems: "center" }}>
            <TextContent id={GlobalConstants.HOME} textContentPromise={textContentPromise} />
        </Stack>
    );
};

export default HomeDashboard;
