"use client";
import { Button, Stack } from "@mui/material";
import React from "react";
import GlobalConstants from "./GlobalConstants";
import TextContent from "./ui/TextContent";
import { Prisma } from "@prisma/client";
import LanguageTranslations from "./ui/LanguageTranslations";
import { useUserContext } from "./context/UserContext";
import { useRouter } from "next/navigation";
import { clientRedirect } from "./lib/utils";

interface HomeDashboardProps {
    textContentPromise: Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>>;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ textContentPromise }) => {
    const { language, user } = useUserContext();
    const router = useRouter();
    return (
        <Stack width={"100%"} alignItems="center" justifyContent="center">
            <Stack
                spacing={4}
                sx={{
                    width: { xs: "100%", lg: "50%" },
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {!user && (
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => clientRedirect(router, [GlobalConstants.APPLY])}
                    >
                        {LanguageTranslations.routeLabel[GlobalConstants.APPLY][language]}
                    </Button>
                )}
                <TextContent id={"home"} textContentPromise={textContentPromise} />
            </Stack>
        </Stack>
    );
};

export default HomeDashboard;
