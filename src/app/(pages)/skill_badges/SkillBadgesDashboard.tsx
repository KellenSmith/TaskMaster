"use client";

import { Button, Dialog, Divider, Stack } from "@mui/material";
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
import z from "zod";
import { useNotificationContext } from "../../context/NotificationContext";
import ConfirmButton from "../../ui/ConfirmButton";

interface SkillBadgesDashboardProps {
    skillBadgesPromise: Promise<Prisma.SkillBadgeGetPayload<true>[]>;
}

const SkillBadgesDashboard = ({ skillBadgesPromise }: SkillBadgesDashboardProps) => {
    const { addNotification } = useNotificationContext();
    const badges = use(skillBadgesPromise);
    const [editBadgeId, setEditBadgeId] = useState<string | null>(null);
    const [createNew, setCreateNew] = useState(false);
    const [isPending, startTransition] = useTransition();

    const createBadgeAction = async (parsedFieldValues: z.infer<typeof SkillBadgeCreateSchema>) => {
        await createSkillBadge(parsedFieldValues);
        setCreateNew(false);
        return "Created skill badge";
    };

    const updateBadgeAction = async (parsedFieldValues: z.infer<typeof SkillBadgeCreateSchema>) => {
        await updateSkillBadge(editBadgeId, parsedFieldValues);
        setEditBadgeId(null);
        return "Updated skill badge";
    };

    const deleteBadgeAction = async (badgeId: string) => {
        startTransition(async () => {
            try {
                await deleteSkillBadge(badgeId);
                addNotification("Deleted skill badge", "success");
            } catch {
                addNotification("Failed deleting skill badge", "error");
            }
        });
    };

    return (
        <>
            <Button onClick={() => setCreateNew(true)}>Add Skill Badge</Button>
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
                                    Edit
                                </Button>
                                <ConfirmButton
                                    color="error"
                                    onClick={() => deleteBadgeAction(badge.id)}
                                    disabled={isPending}
                                >
                                    Delete
                                </ConfirmButton>
                                <Divider />
                            </Stack>
                        </Stack>
                    ))}
            </Stack>
            <Dialog
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
            </Dialog>
        </>
    );
};

export default SkillBadgesDashboard;
