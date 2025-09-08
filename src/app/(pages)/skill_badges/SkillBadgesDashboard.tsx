"use client";

import { Button, Dialog, Divider, Stack, useMediaQuery, useTheme } from "@mui/material";
import { use, useState, useTransition } from "react";
import SkillBadgeCard from "./SkillBadgeCard";
import { Prisma } from "@prisma/client";
import Form from "../../ui/form/Form";
import GlobalConstants from "../../GlobalConstants";
import { SkillBadgeCreateSchema } from "../../lib/zod-schemas";
import {
    createSkillBadge,
    deleteSkillBadge,
    updateSkillBadge,
} from "../../lib/skill-badge-actions";
import { useNotificationContext } from "../../context/NotificationContext";
import ConfirmButton from "../../ui/ConfirmButton";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";

interface SkillBadgesDashboardProps {
    skillBadgesPromise: Promise<Prisma.SkillBadgeGetPayload<true>[]>;
}

const SkillBadgesDashboard = ({ skillBadgesPromise }: SkillBadgesDashboardProps) => {
    const { language } = useUserContext();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const { addNotification } = useNotificationContext();
    const badges = use(skillBadgesPromise);
    const [editBadgeId, setEditBadgeId] = useState<string | null>(null);
    const [createNew, setCreateNew] = useState(false);
    const [isPending, startTransition] = useTransition();

    const createBadgeAction = async (formData: FormData) => {
        try {
            await createSkillBadge(formData);
            setCreateNew(false);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const updateBadgeAction = async (formData: FormData) => {
        try {
            await updateSkillBadge(editBadgeId, formData);
            setEditBadgeId(null);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const deleteBadgeAction = async (badgeId: string) => {
        startTransition(async () => {
            try {
                await deleteSkillBadge(badgeId);
                addNotification(GlobalLanguageTranslations.successfulDelete[language], "success");
            } catch {
                addNotification(GlobalLanguageTranslations.failedDelete[language], "error");
            }
        });
    };

    return (
        <>
            <Button onClick={() => setCreateNew(true)}>
                {LanguageTranslations.addSkillBadge[language]}
            </Button>
            <Stack direction="row" justifyContent="space-around" flexWrap="wrap" gap={2}>
                {badges
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((badge) => (
                        <Stack key={badge.id} spacing={1}>
                            <SkillBadgeCard badge={badge} />
                            <Stack spacing={1} maxWidth={250}>
                                <Button
                                    disabled={isPending}
                                    onClick={() => setEditBadgeId(badge.id)}
                                >
                                    {GlobalLanguageTranslations.edit[language]}
                                </Button>
                                <ConfirmButton
                                    color="error"
                                    onClick={() => deleteBadgeAction(badge.id)}
                                    disabled={isPending}
                                >
                                    {GlobalLanguageTranslations.delete[language]}
                                </ConfirmButton>
                                <Divider />
                            </Stack>
                        </Stack>
                    ))}
            </Stack>
            <Dialog
                fullScreen={isSmallScreen}
                open={!!editBadgeId || createNew}
                onClose={() => setEditBadgeId(null)}
                fullWidth
            >
                <Form
                    name={GlobalConstants.SKILL_BADGE}
                    defaultValues={
                        editBadgeId ? badges.find((b) => b.id === editBadgeId) : undefined
                    }
                    validationSchema={SkillBadgeCreateSchema}
                    action={editBadgeId ? updateBadgeAction : createBadgeAction}
                    editable={true}
                    readOnly={false}
                />
                <Button onClick={() => setEditBadgeId(null)}>
                    {GlobalLanguageTranslations.cancel[language]}
                </Button>
            </Dialog>
        </>
    );
};

export default SkillBadgesDashboard;
