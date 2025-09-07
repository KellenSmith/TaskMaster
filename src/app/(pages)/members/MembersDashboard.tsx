"use client";
import {
    Button,
    Chip,
    Dialog,
    Stack,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { createUser, deleteUser, updateUser, validateUserMembership } from "../../lib/user-actions";
import Datagrid, { ImplementedDatagridEntities, RowActionProps } from "../../ui/Datagrid";
import GlobalConstants from "../../GlobalConstants";
import { GridColDef } from "@mui/x-data-grid";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { isMembershipExpired } from "../../lib/definitions";
import { Prisma, UserStatus } from "@prisma/client";
import { AddMembershipSchema, UserUpdateSchema } from "../../lib/zod-schemas";
import { useUserContext } from "../../context/UserContext";
import {
    Check as CheckIcon,
    Error as ErrorIcon,
    Shield,
    Warning as WarningIcon,
} from "@mui/icons-material";
import { FC, use, useState } from "react";
import { CustomOptionProps } from "../../ui/form/AutocompleteWrapper";
import LanguageTranslations from "./LanguageTranslations";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import Form from "../../ui/form/Form";
import z from "zod";
import { addUserMembership } from "../../lib/user-membership-actions";

interface MembersDashboardProps {
    membersPromise: Promise<
        Prisma.UserGetPayload<{
            include: {
                user_membership: true;
                skill_badges: true;
            };
        }>[]
    >;
    skillBadgesPromise: Promise<Prisma.SkillBadgeGetPayload<true>[]>;
}

const MembersDashboard: FC<MembersDashboardProps> = ({ membersPromise, skillBadgesPromise }) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const { user, language } = useUserContext();
    const skillBadges = use(skillBadgesPromise);
    const [addMembershipDialogOpen, setAddMembershipDialogOpen] =
        useState<ImplementedDatagridEntities | null>(null);

    const isMembershipPending = (member: ImplementedDatagridEntities) =>
        (member as Prisma.UserGetPayload<true>).status === UserStatus.pending;

    const validateMembershipAction = async (member: ImplementedDatagridEntities) => {
        try {
            await validateUserMembership(member.id);
            return LanguageTranslations.validatedMembership[language];
        } catch {
            throw new Error(LanguageTranslations.failedValidatedMembership[language]);
        }
    };

    const addMembershipAction = async (fieldValues: z.infer<typeof AddMembershipSchema>) => {
        try {
            await addUserMembership(addMembershipDialogOpen!.id, fieldValues.expires_at);
            return LanguageTranslations.addedMembership[language];
        } catch {
            throw new Error(LanguageTranslations.failedAddedMembership[language]);
        }
    };

    const deleteUserAction = async (member: ImplementedDatagridEntities) => {
        try {
            await deleteUser(member.id);
            return "Deleted user";
        } catch {
            throw new Error("Failed deleting user");
        }
    };

    const rowActions: RowActionProps[] = [
        {
            name: GlobalConstants.VALIDATE_MEMBERSHIP,
            serverAction: validateMembershipAction,
            available: (member: ImplementedDatagridEntities) =>
                member && isMembershipPending(member),
            buttonLabel: LanguageTranslations.validateMembership[language],
        },
        {
            name: GlobalConstants.DELETE,
            serverAction: deleteUserAction,
            available: (member: ImplementedDatagridEntities) => user && member?.id !== user.id,
            buttonColor: "error",
            buttonLabel: GlobalLanguageTranslations.delete[language],
        },
        {
            name: GlobalConstants.ADD_MEMBERSHIP,
            serverAction: async (member: ImplementedDatagridEntities) => {
                setAddMembershipDialogOpen(member);
                return "Opened add membership dialog";
            },
            available: (row: ImplementedDatagridEntities) => {
                const member = row as Prisma.UserGetPayload<{
                    include: {
                        user_membership: true;
                        skill_badges: true;
                    };
                }>;
                return member && isMembershipExpired(member) && !isMembershipPending(member);
            },
            buttonLabel: LanguageTranslations.addMembership[language],
        },
    ];

    const getStatusConfig = (member: ImplementedDatagridEntities) => {
        if (isMembershipPending(member))
            return {
                status: GlobalConstants.PENDING,
                icon: WarningIcon,
                color: "warning.main",
            };
        if (
            isMembershipExpired(
                member as Prisma.UserGetPayload<{
                    include: {
                        user_membership: true;
                        skill_badges: true;
                    };
                }>,
            )
        )
            return {
                status: GlobalConstants.EXPIRED,
                icon: ErrorIcon,
                color: "error.main",
            };
        return {
            status: GlobalConstants.ACTIVE,
            icon: CheckIcon,
            color: "success.main",
        };
    };

    const customColumns: GridColDef[] = [
        {
            field: GlobalConstants.USER_MEMBERSHIP,
            headerName: "Membership status",
            type: "string",
            valueGetter: (_, member: ImplementedDatagridEntities) => {
                const { status } = getStatusConfig(member);
                return status;
            },
            sortComparator: (value1, value2) => {
                if (value1 === value2) return 0;
                // pending - active/expired
                if (
                    value1 === GlobalConstants.PENDING &&
                    [GlobalConstants.ACTIVE, GlobalConstants.EXPIRED].includes(value2)
                )
                    return -1;
                // active - pending/expired
                if (value1 === GlobalConstants.ACTIVE) {
                    if (value2 === GlobalConstants.EXPIRED) return -1;
                    if (value2 === GlobalConstants.PENDING) return 1;
                }
                // expired - pending/active
                if (value1 === GlobalConstants.EXPIRED) return 1;
            },
            renderCell: (params) => {
                const member: ImplementedDatagridEntities = params.row;
                const { status, icon: Icon, color } = getStatusConfig(member);
                const statusText = (FieldLabels[status][language] as string) || status;
                return (
                    <Stack
                        height="100%"
                        direction="row"
                        justifyContent="flex-start"
                        alignItems="center"
                        gap={1}
                    >
                        <Icon sx={{ color }} />
                        <Typography variant="body2" sx={{ color }}>
                            {statusText}
                        </Typography>
                    </Stack>
                );
            },
        },
        {
            field: GlobalConstants.SKILL_BADGES,
            headerName: "Skill Badges",
            type: "string",
            sortable: true,
            sortComparator: (skillBadges1, skillBadges2) => {
                return skillBadges1.length - skillBadges2.length;
            },
            renderCell: (params) => {
                const member: ImplementedDatagridEntities = params.row;
                const userSkillBadges =
                    (
                        member as Prisma.UserGetPayload<{
                            include: { skill_badges: true };
                        }>
                    )?.skill_badges || [];
                return (
                    <Tooltip
                        disableHoverListener={userSkillBadges.length === 0}
                        placement="right"
                        title={
                            <Typography sx={{ whiteSpace: "pre-line", maxWidth: 180 }}>
                                {userSkillBadges
                                    .map((userSkillBadge) => {
                                        const skillBadge = skillBadges.find(
                                            (skillBadge) =>
                                                skillBadge.id === userSkillBadge.skill_badge_id,
                                        );
                                        return skillBadge ? skillBadge.name : "";
                                    })
                                    .filter(Boolean)
                                    .join(", ")
                                    .replace(/, /g, ",\n")}
                            </Typography>
                        }
                    >
                        <Chip label={userSkillBadges.length} icon={<Shield />} />
                    </Tooltip>
                );
            },
        },
    ];

    const hiddenColumns = [GlobalConstants.ID];

    return (
        <Stack sx={{ height: "100%" }}>
            <Datagrid
                name={GlobalConstants.USER}
                dataGridRowsPromise={membersPromise}
                createAction={createUser}
                updateAction={updateUser}
                validationSchema={UserUpdateSchema}
                rowActions={rowActions}
                customColumns={customColumns}
                hiddenColumns={hiddenColumns}
                getDefaultFormValues={(member: ImplementedDatagridEntities) =>
                    member
                        ? {
                              [GlobalConstants.SKILL_BADGES]: (
                                  member as Prisma.UserGetPayload<{
                                      include: { skill_badges: true };
                                  }>
                              ).skill_badges.map((badge) => badge.skill_badge_id),
                          }
                        : null
                }
                customFormOptions={{
                    [GlobalConstants.SKILL_BADGES]: skillBadges.map(
                        (badge) =>
                            ({
                                id: badge.id,
                                label: badge.name,
                            }) as CustomOptionProps,
                    ),
                }}
            />
            <Dialog
                open={!!addMembershipDialogOpen}
                onClose={() => setAddMembershipDialogOpen(null)}
                fullWidth
                maxWidth="md"
                fullScreen={isSmallScreen}
            >
                <Form
                    name={GlobalConstants.ADD_MEMBERSHIP}
                    validationSchema={AddMembershipSchema}
                    action={addMembershipAction}
                    editable={true}
                    readOnly={false}
                />
                <Button onClick={() => setAddMembershipDialogOpen(null)}>
                    {GlobalLanguageTranslations.cancel[language]}
                </Button>
            </Dialog>
        </Stack>
    );
};

export default MembersDashboard;
