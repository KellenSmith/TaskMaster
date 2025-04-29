import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material";
import { useState } from "react";

const ConfirmButton = ({ onClick, children, confirmText = "", ...buttonProps }) => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button onClick={() => setOpen(true)} {...buttonProps}>
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
                    <Button onClick={onClick}>yes, proceed</Button>
                    <Button onClick={() => setOpen(false)}> cancel</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ConfirmButton;
