"use client";
import { Button, Stack, TextField, Typography } from "@mui/material";
import { FC, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import GlobalConstants from "../../../GlobalConstants";
import { clientRedirect } from "../../../lib/utils";
import { useUserContext } from "../../../context/UserContext";
import LanguageTranslations from "../LanguageTranslations";

const ManualCodeEntryDashboard: FC = () => {
    const { language } = useUserContext();
    const router = useRouter();
    const [userCode, setUserCode] = useState("");

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (!userCode.trim()) return;
        clientRedirect(router, [GlobalConstants.LOGIN, GlobalConstants.APPROVE, userCode.trim()]);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack spacing={2} sx={{ alignItems: "center" }}>
                <Typography>{LanguageTranslations.enterCodeFromOtherDevice[language]}</Typography>
                <TextField
                    label={LanguageTranslations.orEnterCodeManually[language]}
                    value={userCode}
                    onChange={(event) => setUserCode(event.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX"
                />
                <Button type="submit" variant="contained">
                    {LanguageTranslations.continue[language]}
                </Button>
            </Stack>
        </form>
    );
};

export default ManualCodeEntryDashboard;
