"use client";
import { Stack } from "@mui/material";
import React from "react";
import TextContent from "../../ui/TextContent";
import { Prisma } from "@prisma/client";

interface InfoDashboardProps {
    textContentPromise: Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>>;
    id: string;
}

const InfoDashboard: React.FC<InfoDashboardProps> = ({ textContentPromise, id }) => {
    return (
        <Stack sx={{ height: "100%", alignItems: "center" }}>
            <TextContent id={id} textContentPromise={textContentPromise} />
        </Stack>
    );
};

export default InfoDashboard;
