"use client";
import { Stack } from "@mui/material";
import React from "react";
import GlobalConstants from "../../GlobalConstants";
import TextContent from "../../ui/TextContent";
import { Prisma } from "@prisma/client";

interface ContactDashboardProps {
    textContentPromise: Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>>;
}

const ContactDashboard: React.FC<ContactDashboardProps> = ({ textContentPromise }) => {
    return (
        <Stack sx={{ height: "100%", justifyContent: "center", alignItems: "center" }}>
            <TextContent id={GlobalConstants.CONTACT} textContentPromise={textContentPromise} />
        </Stack>
    );
};

export default ContactDashboard;
