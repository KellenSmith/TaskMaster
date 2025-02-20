"use client";

import { Button, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { useState } from "react";
import Form, { FormActionState } from "../ui/form/Form";
import GlobalConstants from "../GlobalConstants";
import { useUserContext } from "../context/UserContext";
import { createEvent } from "../lib/event-actions";

const CalendarPage = () => {
    const { user } = useUserContext();
    const [createOpen, setCreateOpen] = useState(false);

    const createEventWithHost = async (currentActionState: FormActionState, formData: FormData) => {
        return await createEvent(user[GlobalConstants.ID], currentActionState, formData);
    };

    return (
        <>
            {user && <Button onClick={() => setCreateOpen(true)}>create event</Button>}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
                <DialogTitle>Create event</DialogTitle>
                <DialogContent>
                    <Form
                        name={GlobalConstants.EVENT}
                        buttonLabel={GlobalConstants.CREATE}
                        action={createEventWithHost}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CalendarPage;
