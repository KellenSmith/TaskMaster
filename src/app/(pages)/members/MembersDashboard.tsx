"use client";
import { Chip, Stack, Tooltip, Typography } from "@mui/material";
import { deleteUser, updateUser } from "../../lib/user-actions";
import Datagrid, { ImplementedDatagridEntities, RowActionProps } from "../../ui/Datagrid";
import GlobalConstants from "../../GlobalConstants";
import { GridColDef } from "@mui/x-data-grid";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { isMembershipExpired } from "../../lib/definitions";
import { validateUserMembership } from "../../lib/user-credentials-actions";
import { Prisma } from "@prisma/client";
import z from "zod";
import { UserUpdateSchema } from "../../lib/zod-schemas";
import { useUserContext } from "../../context/UserContext";
import {
    Check as CheckIcon,
    Error as ErrorIcon,
    Shield,
    Warning as WarningIcon,
} from "@mui/icons-material";
import { FC, use } from "react";

interface MembersDashboardProps {
    membersPromise: Promise<
        Prisma.UserGetPayload<{
            include: {
                user_credentials: { select: { id: true } };
                user_membership: true;
                skill_badges: true;
            };
        }>[]
    >;
    skillBadgesPromise: Promise<Prisma.SkillBadgeGetPayload<true>[]>;
}

const MembersDashboard: FC<MembersDashboardProps> = ({ membersPromise, skillBadgesPromise }) => {
    const { user } = useUserContext();
    const skillBadges = use(skillBadgesPromise);

    const isMembershipPending = (member: ImplementedDatagridEntities) =>
        !(
            member as Prisma.UserGetPayload<{
                include: {
                    user_credentials: true;
                    user_membership: true;
                    skill_badges: true;
                };
            }>
        ).user_credentials;

    const updateUserAction = async (
        member: ImplementedDatagridEntities,
        parsedFieldValues: z.infer<typeof UserUpdateSchema>,
    ) => {
        try {
            await updateUser(member.id, parsedFieldValues);
            return "User updated successfully";
        } catch {
            throw new Error("Failed updating user");
        }
    };

    const validateMembershipAction = async (member: ImplementedDatagridEntities) => {
        try {
            await validateUserMembership(member.id);
            return "Validated user membership";
        } catch {
            throw new Error("Failed validating user membership");
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
        },
        {
            name: GlobalConstants.DELETE,
            serverAction: deleteUserAction,
            available: (member: ImplementedDatagridEntities) => member?.id !== user.id,
            buttonColor: "error",
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
                        user_credentials: true;
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
                const statusText = FieldLabels[status] || status;
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

    const hiddenColumns = [GlobalConstants.ID, GlobalConstants.USER_CREDENTIALS];

    return (
        <Stack sx={{ height: "100%" }}>
            <Datagrid
                name={GlobalConstants.USER}
                dataGridRowsPromise={membersPromise}
                updateAction={updateUserAction}
                validationSchema={UserUpdateSchema}
                rowActions={rowActions}
                customColumns={customColumns}
                hiddenColumns={hiddenColumns}
            />
        </Stack>
    );
};

export default MembersDashboard;
