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
import { Language, Prisma } from "@prisma/client";
import { ExpandMore } from "@mui/icons-material";
import z from "zod";
import { EmailSendoutSchema } from "../../lib/zod-schemas";
import { useUserContext } from "../../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";

const sendToOptions = {
    ALL: {
        [Language.english]: "All",
        [Language.swedish]: "Alla",
    },
    CONSENTING: {
        [Language.english]: "Consenting to newsletters",
        [Language.swedish]: "Samtycker till nyhetsbrev",
    },
};

const SendoutPage: FC = () => {
    const { language } = useUserContext();
    const [sendTo, setSendTo] = useState(sendToOptions.ALL[language]);
    const [recipientCount, setRecipientCount] = useState<number>(0);

    const getRecipientCriteria = useCallback(() => {
        const recipientCriteria: Prisma.UserWhereInput = {};
        if (sendTo === sendToOptions.CONSENTING[language]) {
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
        try {
            parsedFieldValues[GlobalConstants.RECIPIENT_CRITERIA] = getRecipientCriteria();
            const result = await sendMassEmail(getRecipientCriteria(), parsedFieldValues);
            return LanguageTranslations.successfulSendout[language](result);
        } catch {
            throw new Error(LanguageTranslations.failedSendMail[language]);
        }
    };

    return (
        <Stack>
            <Accordion sx={{ padding: 1 }} defaultExpanded={true}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>
                        {LanguageTranslations.sendToRecipients[language](recipientCount)}
                    </Typography>
                </AccordionSummary>
                <Stack spacing={2} padding={1}>
                    <FormControl>
                        <RadioGroup value={sendTo} onChange={(e) => setSendTo(e.target.value)}>
                            {Object.values(sendToOptions).map((option) => (
                                <FormControlLabel
                                    key={option[language]}
                                    value={option[language]}
                                    control={<Radio />}
                                    label={option[language]}
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>
                </Stack>
            </Accordion>
            <Form
                name={GlobalConstants.SENDOUT}
                action={sendMassEmailToRecipientsWithCriteria}
                buttonLabel={LanguageTranslations.send[language]}
                readOnly={false}
                editable={false}
            />
        </Stack>
    );
};
export default SendoutPage;
