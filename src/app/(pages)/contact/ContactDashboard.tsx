"use client";
import { Stack } from "@mui/material";
import React from "react";
import TextContent from "../../ui/TextContent";
import { Prisma } from "../../../prisma/generated/browser";

interface ContactDashboardProps {
    textContentPromise: Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>>;
}

const ContactDashboard: React.FC<ContactDashboardProps> = ({ textContentPromise }) => {
    return (
        <Stack sx={{ height: "100%", alignItems: "center" }}>
            <TextContent textContentPromise={textContentPromise} />
        </Stack>
    );
};

export default ContactDashboard;
