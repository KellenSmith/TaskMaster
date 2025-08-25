"use client";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material";
import { useState, useTransition } from "react";

const ConfirmButton = ({ onClick, children, confirmText = "", ...buttonProps }) => {
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
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Please confirm</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {confirmText || "This action is irreversible. Are you sure?"}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button disabled={isPending} onClick={wrappedOnClick}>
                        yes, proceed
                    </Button>
                    <Button disabled={isPending} onClick={() => setOpen(false)}>
                        cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ConfirmButton;
