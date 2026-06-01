"use client";
import { Stack } from "@mui/material";
import React from "react";
import TextContent from "../../ui/TextContent";
import { Prisma } from "../../../prisma/generated/browser";

interface InfoDashboardProps {
    textContentPromise: Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>>;
}

const InfoDashboard: React.FC<InfoDashboardProps> = ({ textContentPromise }) => {
    return (
        <Stack sx={{ height: "100%", alignItems: "center" }}>
            <TextContent textContentPromise={textContentPromise} />
        </Stack>
    );
};

export default InfoDashboard;
