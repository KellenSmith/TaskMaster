"use client";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { useState, useTransition } from "react";
import LanguageTranslations from "./LanguageTranslations";
import GlobalLanguageTranslations from "../GlobalLanguageTranslations";
import { useUserContext } from "../context/UserContext";

const ConfirmButton = ({ onClick, children, confirmText = "", ...buttonProps }) => {
    const { language } = useUserContext();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const wrappedOnClick = async () => {
        startTransition(async () => {
            await onClick();
            setOpen(false);
        });
    };
    return (
        <>
            <Button disabled={isPending} onClick={() => setOpen(true)} {...buttonProps}>
                {children}
            </Button>
            <Dialog
                fullScreen={isSmallScreen}
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{LanguageTranslations.confirm[language]}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {confirmText || LanguageTranslations.areYouSure[language]}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" disabled={isPending} onClick={wrappedOnClick}>
                        {LanguageTranslations.proceed[language]}
                    </Button>
                    <Button disabled={isPending} onClick={() => setOpen(false)}>
                        {GlobalLanguageTranslations.cancel[language]}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ConfirmButton;
