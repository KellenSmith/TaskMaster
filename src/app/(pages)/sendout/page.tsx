"use client";

import {
    Accordion,
    AccordionSummary,
    FormControl,
    FormControlLabel,
    Radio,
    RadioGroup,
    Stack,
    Typography,
} from "@mui/material";
import { FC, useCallback, useEffect, useState } from "react";
import GlobalConstants from "../../GlobalConstants";
import { sendMassEmail, getEmailRecipientCount } from "../../lib/mail-service/mail-service";
import Form from "../../ui/form/Form";
import { Prisma } from "@prisma/client";
import { ExpandMore } from "@mui/icons-material";
import z from "zod";
import { EmailSendoutSchema } from "../../lib/zod-schemas";

const sendToOptions = {
    ALL: "All",
    CONSENTING: "Consenting to newsletters",
};

const SendoutPage: FC = () => {
    const [sendTo, setSendTo] = useState<string>(sendToOptions.ALL);
    const [recipientCount, setRecipientCount] = useState<number>(0);

    const getRecipientCriteria = useCallback(() => {
        const recipientCriteria: Prisma.UserWhereInput = {};
        if (sendTo === sendToOptions.CONSENTING) {
            recipientCriteria[GlobalConstants.CONSENT_TO_NEWSLETTERS] = true;
        }
        return recipientCriteria;
    }, [sendTo]);

    useEffect(() => {
        const fetchRecipientCount = async () => {
            const count = await getEmailRecipientCount(getRecipientCriteria());
            setRecipientCount(count);
        };
        fetchRecipientCount();
    }, [sendTo, getRecipientCriteria]);

    const sendMassEmailToRecipientsWithCriteria = async (
        parsedFieldValues: z.infer<typeof EmailSendoutSchema>,
    ) => {
        parsedFieldValues[GlobalConstants.RECIPIENT_CRITERIA] = getRecipientCriteria();
        const sendState = await sendMassEmail(getRecipientCriteria(), parsedFieldValues);
        return sendState;
    };

    return (
        <Stack>
            <Accordion sx={{ padding: 1 }} defaultExpanded={true}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>{`Send to ${recipientCount} recipients`}</Typography>
                </AccordionSummary>
                <Stack spacing={2} padding={1}>
                    <FormControl>
                        <RadioGroup value={sendTo} onChange={(e) => setSendTo(e.target.value)}>
                            {Object.values(sendToOptions).map((option) => (
                                <FormControlLabel
                                    key={option}
                                    value={option}
                                    control={<Radio />}
                                    label={option}
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>
                </Stack>
            </Accordion>
            <Form
                name={GlobalConstants.SENDOUT}
                action={sendMassEmailToRecipientsWithCriteria}
                buttonLabel="Send"
                readOnly={false}
                editable={false}
            />
        </Stack>
    );
};
export default SendoutPage;
