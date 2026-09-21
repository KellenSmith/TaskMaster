"use client";
import { Button, Stack } from "@mui/material";
import React from "react";
import GlobalConstants from "./GlobalConstants";
import TextContent from "./ui/TextContent";
import LanguageTranslations from "./ui/LanguageTranslations";
import { useUserContext } from "./context/UserContext";
import { useRouter } from "next/navigation";
import { clientRedirect } from "./lib/utils";
import { Prisma } from "../prisma/generated/browser";

interface HomeDashboardProps {
    textContentPromise: Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>>;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ textContentPromise }) => {
    const { user, language } = useUserContext();
    const router = useRouter();

    return (
        <Stack
            sx={{
                width: "100%",
            }}
        >
            <Stack
                spacing={4}
                sx={{
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {!user && (
                    // The primary call to action for a visitor. Full-width outlined read as a divider.
                    <Button
                        variant="contained"
                        size="large"
                        sx={{ alignSelf: "center", width: "100%", maxWidth: 360 }}
                        onClick={() => clientRedirect(router, [GlobalConstants.APPLY])}
                    >
                        {LanguageTranslations.routeLabel[GlobalConstants.APPLY][language]}
                    </Button>
                )}
                <TextContent textContentPromise={textContentPromise} />
            </Stack>
        </Stack>
    );
};

export default HomeDashboard;
