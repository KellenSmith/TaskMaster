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
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { FC, useCallback, useEffect, useState } from "react";
import GlobalConstants from "../../GlobalConstants";
import { sendMassEmail, getEmailRecipientCount } from "../../lib/mail-service/mail-service";
import Form from "../../ui/form/Form";
import { Language, Prisma } from "@prisma/client";
import { ExpandMore } from "@mui/icons-material";
import { useUserContext } from "../../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";
import Datagrid, { RowActionProps } from "../../ui/Datagrid";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import { deleteNewsletterJob } from "../../lib/mail-service/newsletter-actions";

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

interface SendoutPageProps {
    newsLetterJobsPromise: Promise<Prisma.NewsletterJobGetPayload<true>[]>;
}

const SendoutDashboard: FC<SendoutPageProps> = ({ newsLetterJobsPromise }: SendoutPageProps) => {
    const { language } = useUserContext();
    const [sendTo, setSendTo] = useState(sendToOptions.ALL[language]);
    const [recipientCount, setRecipientCount] = useState<number>(0);
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("md"));

    const getRecipientCriteria = useCallback(() => {
        const recipientCriteria: Prisma.UserWhereInput = {};
        if (sendTo === sendToOptions.CONSENTING[language]) {
            recipientCriteria[GlobalConstants.CONSENT_TO_NEWSLETTERS] = true;
        }
        return recipientCriteria;
    }, [sendTo, language]);

    useEffect(() => {
        const fetchRecipientCount = async () => {
            const count = await getEmailRecipientCount(getRecipientCriteria());
            setRecipientCount(count);
        };
        fetchRecipientCount();
    }, [sendTo, getRecipientCriteria]);

    const sendMassEmailToRecipientsWithCriteria = async (formData: FormData) => {
        try {
            await sendMassEmail(getRecipientCriteria(), formData);
            return LanguageTranslations.successfulSendout[language];
        } catch {
            throw new Error(LanguageTranslations.failedSendMail[language]);
        }
    };

    const rowActions: RowActionProps[] = [
        {
            name: GlobalLanguageTranslations.delete[language],
            serverAction: async (row) => {
                await deleteNewsletterJob(row.id);
                return GlobalLanguageTranslations.successfulDelete[language];
            },
            available: (row) => !!row && !!row.id,
            buttonLabel: GlobalLanguageTranslations.delete[language],
            buttonColor: "error",
        },
    ];

    return (
        <Stack
            height="100%"
            direction={isSmall ? "column" : "row"}
            justifyContent={"space-around"}
            spacing={2}
        >
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
                    editable={true}
                />
            </Stack>

            <Stack height={"100%"} maxWidth={isSmall ? "100%" : "50%"} flex={1}>
                <Datagrid dataGridRowsPromise={newsLetterJobsPromise} rowActions={rowActions} />
            </Stack>
        </Stack>
    );
};
export default SendoutDashboard;
