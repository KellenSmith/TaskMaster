"use client";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Dialog,
    Stack,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import {
    createUser,
    deleteUser,
    deleteUserBlacklistEntry,
    updateUser,
    upsertUserBlacklistEntry,
    validateUserMembership,
} from "../../lib/user-actions";
import Datagrid, {
    ImplementedDatagridEntities,
    ImplementedUserType,
    RowActionProps,
} from "../../ui/Datagrid";
import GlobalConstants from "../../GlobalConstants";
import { GridColDef } from "@mui/x-data-grid";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { isMemberBlacklisted, isMembershipExpired } from "../../lib/utils";
import {
    AddMembershipSchema,
    BlacklistEntryCreateSchema,
    UserUpdateSchema,
} from "../../lib/zod-schemas";
import { useUserContext } from "../../context/UserContext";
import {
    Block,
    Check as CheckIcon,
    Clear,
    Error as ErrorIcon,
    Shield,
    Warning as WarningIcon,
} from "@mui/icons-material";
import { FC, use, useState } from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { CustomOptionProps } from "../../ui/form/AutocompleteWrapper";
import LanguageTranslations from "./LanguageTranslations";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import Form from "../../ui/form/Form";
import { addUserMembership } from "../../lib/user-membership-actions";
import { formatUtcDateToTimezone, openResourceInNewTab } from "../../ui/utils";
import { UserStatus } from "../../../prisma/generated/enums";
import { Prisma } from "../../../prisma/generated/browser";
import { useRouter } from "next/navigation";
import { userFieldLabels } from "../../ui/form/LanguageTranslations";
import ConfirmButton from "../../ui/ConfirmButton";
import { useNotificationContext } from "../../context/NotificationContext";

interface MembersDashboardProps {
    membersPromise: Promise<ImplementedUserType[]>;
    skillBadgesPromise: Promise<Prisma.SkillBadgeGetPayload<true>[]>;
    membershipsPromise: Promise<
        Prisma.MembershipGetPayload<{ include: { product: { select: { name: true } } } }>[]
    >;
}

const MembersDashboard: FC<MembersDashboardProps> = ({
    membersPromise,
    skillBadgesPromise,
    membershipsPromise,
}) => {
    const router = useRouter();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const { user, language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const members = use(membersPromise);
    const skillBadges = use(skillBadgesPromise);
    const memberships = use(membershipsPromise);
    const [addMembershipDialogOpen, setAddMembershipDialogOpen] =
        useState<ImplementedUserType | null>(null);
    const [editBlacklistEntryUser, setEditBlacklistEntryUser] =
        useState<ImplementedUserType | null>(null);

    const getUserMembership = (user: ImplementedUserType) =>
        memberships.find(
            (membership) => membership.product_id === user.user_membership?.membership_id,
        );

    const validateMembershipAction = async (member: ImplementedDatagridEntities) => {
        try {
            await validateUserMembership(member.id);
            router.refresh();
            return LanguageTranslations.validatedMembership[language];
        } catch {
            throw new Error(LanguageTranslations.failedValidatedMembership[language]);
        }
    };

    const addMembershipAction = async (formData: FormData) => {
        try {
            await addUserMembership(addMembershipDialogOpen!.id, formData);
            setAddMembershipDialogOpen(null);
            router.refresh();
            return LanguageTranslations.addedMembership[language];
        } catch {
            throw new Error(LanguageTranslations.failedAddedMembership[language]);
        }
    };

    const upsertUserBlacklistEntryAction = async (formData: FormData) => {
        try {
            if (!editBlacklistEntryUser) return "No chosen user";
            await upsertUserBlacklistEntry(editBlacklistEntryUser.id, formData);
            setEditBlacklistEntryUser(null);
            router.refresh();
            return LanguageTranslations.blacklistedMember[language];
        } catch {
            throw new Error(LanguageTranslations.failedBlacklistedMember[language]);
        }
    };

    const deleteBlacklistEntryAction = async () => {
        try {
            if (!editBlacklistEntryUser) {
                addNotification("No chosen user", "error");
                return;
            }
            await deleteUserBlacklistEntry(editBlacklistEntryUser.id);
            setEditBlacklistEntryUser(null);
            addNotification(LanguageTranslations.deletedBlacklistEntry[language], "success");
            router.refresh();
        } catch {
            addNotification(LanguageTranslations.failedDeletedBlacklistEntry[language], "error");
        }
    };

    const deleteUserAction = async (member: ImplementedDatagridEntities) => {
        try {
            await deleteUser(member.id);
            router.refresh();
            return "Deleted user";
        } catch {
            throw new Error("Failed deleting user");
        }
    };

    // PDF styles
    const styles = StyleSheet.create({
        page: { padding: 24 },
        header: { fontSize: 18, marginBottom: 12, fontWeight: "bold" },
        row: { flexDirection: "row", borderBottom: "1px solid #eee", paddingVertical: 4 },
        cell: { flex: 1, fontSize: 12 },
        tableHeader: { flexDirection: "row", borderBottom: "2px solid #333", marginBottom: 6 },
        headerCell: { flex: 1, fontWeight: "bold", fontSize: 13 },
    });

    // PDF Document component
    const MembersListPDF = ({
        filteredMembers,
    }: {
        filteredMembers: Prisma.UserGetPayload<true>[];
    }) => (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.header}>Members List</Text>
                <View style={styles.tableHeader}>
                    <Text style={styles.headerCell}>Email</Text>
                    <Text style={styles.headerCell}>Nickname</Text>
                </View>
                {[...filteredMembers]
                    .sort((a, b) => a.email.localeCompare(b.email))
                    .map((member, idx) => (
                        <View style={styles.row} key={idx}>
                            <Text style={styles.cell}>{member.email}</Text>
                            <Text style={styles.cell}>{member.nickname || ""}</Text>
                        </View>
                    ))}
            </Page>
        </Document>
    );

    const filteredRowsActions = [
        {
            action: async (filteredMembers: ImplementedDatagridEntities[]) => {
                // Generate PDF blob
                const doc = <MembersListPDF filteredMembers={filteredMembers as typeof members} />;
                const asPdf = await pdf(doc).toBlob();
                const url = URL.createObjectURL(asPdf);
                openResourceInNewTab(url);
            },
            buttonLabel: LanguageTranslations.printMembersList[language],
        },
    ];

    const rowActions: RowActionProps[] = [
        {
            name: GlobalConstants.VALIDATE_MEMBERSHIP,
            serverAction: validateMembershipAction,
            available: (member: ImplementedDatagridEntities) =>
                (member as ImplementedUserType)?.status === UserStatus.pending,
            buttonLabel: LanguageTranslations.validateMembership[language],
        },
        {
            name: GlobalConstants.DELETE,
            serverAction: deleteUserAction,
            available: (member: ImplementedDatagridEntities) => !!user && member?.id !== user.id,
            buttonColor: "error",
            buttonLabel: GlobalLanguageTranslations.delete[language],
        },
        {
            name: GlobalConstants.ADD_MEMBERSHIP,
            serverAction: async (member: ImplementedDatagridEntities) => {
                setAddMembershipDialogOpen(member as ImplementedUserType);
                return "";
            },
            available: (row: ImplementedDatagridEntities) =>
                !(row as ImplementedUserType)?.user_membership &&
                !((row as ImplementedUserType)?.status === UserStatus.pending),
            buttonLabel: LanguageTranslations.addMembership[language],
        },
        {
            name: GlobalConstants.MEMBERSHIP_ID,
            serverAction: async (member: ImplementedDatagridEntities) => {
                setAddMembershipDialogOpen(member as ImplementedUserType);
                return "";
            },
            available: (row: ImplementedDatagridEntities) =>
                !!(row as ImplementedUserType)?.user_membership,
            buttonLabel: LanguageTranslations.changeMembership[language],
        },
        {
            name: GlobalConstants.BLACKLIST_ENTRY,
            serverAction: async (member: ImplementedDatagridEntities) => {
                setEditBlacklistEntryUser(member as ImplementedUserType);
                return "";
            },
            available: () => true,
            buttonLabel: LanguageTranslations.blacklistMember[language],
        },
    ];

    const getStatusConfig = (member: ImplementedDatagridEntities) => {
        if (isMemberBlacklisted(member as ImplementedUserType))
            return {
                status: GlobalConstants.BLACKLISTED,
                icon: Block,
                color: "error.main",
            };
        if ((member as ImplementedUserType)?.status === UserStatus.pending)
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
                        blacklist_entry: true;
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
            field: GlobalConstants.STATUS,
            headerName: "Membership status",
            type: "string",
            valueGetter: (_, member: ImplementedDatagridEntities) => {
                const { status } = getStatusConfig(member);
                return status;
            },
            sortComparator: (value1, value2) => {
                const options = [
                    GlobalConstants.PENDING,
                    GlobalConstants.ACTIVE,
                    GlobalConstants.EXPIRED,
                    GlobalConstants.BLACKLISTED,
                ];
                return options.indexOf(value1) - options.indexOf(value2);
            },
            renderCell: (params) => {
                const member: ImplementedUserType = params.row;
                const { status, icon: Icon, color } = getStatusConfig(member);
                const statusText = (FieldLabels[status][language] as string) || status;
                return (
                    <Stack
                        direction="row"
                        sx={{
                            height: "100%",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: 1,
                        }}
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
            field: GlobalConstants.EXPIRES_AT,
            headerName: userFieldLabels[GlobalConstants.EXPIRES_AT][language],
            type: "dateTime",
            valueGetter: (_, member: ImplementedDatagridEntities) =>
                (member as ImplementedUserType)?.user_membership?.expires_at,
            valueFormatter: (value) => formatUtcDateToTimezone(value),
        },
        {
            field: GlobalConstants.MEMBERSHIP_ID,
            headerName: "Membership",
            type: "string",
            valueGetter: (_, member: ImplementedDatagridEntities) => {
                const userMembership = getUserMembership(member as ImplementedUserType);
                return userMembership?.product.name || null;
            },
        },
        {
            field: GlobalConstants.SKILL_BADGES,
            headerName: "Skill Badges",
            type: "string",
            sortable: true,
            valueGetter: (_, member: ImplementedDatagridEntities) => {
                if (members?.length === 0) return "None";
                const userSkillBadgeNames = (member as (typeof members)[0]).skill_badges.map(
                    (skillBadge) => {
                        const badgeInfo = skillBadges.find(
                            (badge) => badge.id === skillBadge.skill_badge_id,
                        );
                        return badgeInfo ? badgeInfo.name : "Unknown badge";
                    },
                );
                return userSkillBadgeNames;
            },
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
        {
            field: GlobalConstants.BLACKLIST_ENTRY,
            headerName: "Blacklist entry",
            type: "boolean",
            valueGetter: (_, member: ImplementedDatagridEntities) =>
                !!(member as ImplementedUserType).blacklist_entry,
            renderCell: (params) => {
                const member: ImplementedUserType = params.row;
                return (
                    <Tooltip
                        disableHoverListener={!member.blacklist_entry}
                        placement="right"
                        title={
                            member.blacklist_entry ? (
                                <Card>
                                    <CardHeader title={"Blacklist entry"} />
                                    <CardContent>
                                        <Stack spacing={1}>
                                            <Typography sx={{ whiteSpace: "pre-line" }}>
                                                {`${userFieldLabels[GlobalConstants.CREATED_AT][language]}: ${formatUtcDateToTimezone(member.blacklist_entry?.created_at)}`}
                                            </Typography>
                                            {member.blacklist_entry?.expires_at && (
                                                <Typography sx={{ whiteSpace: "pre-line" }}>
                                                    {`${userFieldLabels[GlobalConstants.EXPIRES_AT][language]}: ${formatUtcDateToTimezone(member.blacklist_entry.expires_at)}`}
                                                </Typography>
                                            )}
                                            <Typography sx={{ whiteSpace: "pre-line" }}>
                                                {`${userFieldLabels[GlobalConstants.CREATED_BY][language]}: ${member.blacklist_entry.created_by?.nickname || "Unknown"}`}
                                            </Typography>
                                            <Typography sx={{ whiteSpace: "pre-line" }}>
                                                {`${userFieldLabels[GlobalConstants.REASON][language]}: ${member.blacklist_entry.reason}`}
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ) : null
                        }
                    >
                        {member.blacklist_entry ? <CheckIcon /> : <Clear />}
                    </Tooltip>
                );
            },
        },
    ];

    const hiddenColumns = [
        GlobalConstants.ID,
        GlobalConstants.EMAIL_VERIFIED,
        GlobalConstants.USER_MEMBERSHIP,
    ];

    return (
        <Stack sx={{ height: "100%" }}>
            <Datagrid
                name={GlobalConstants.USER}
                dataGridRowsPromise={membersPromise}
                createAction={createUser}
                updateAction={updateUser}
                validationSchema={UserUpdateSchema}
                rowActions={rowActions}
                filteredRowsActions={filteredRowsActions}
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
                        : {}
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
                    {...(addMembershipDialogOpen?.user_membership && {
                        defaultValues: {
                            [GlobalConstants.MEMBERSHIP_ID]:
                                addMembershipDialogOpen.user_membership.membership_id,
                            [GlobalConstants.EXPIRES_AT]:
                                addMembershipDialogOpen.user_membership.expires_at,
                        },
                    })}
                    customOptions={{
                        [GlobalConstants.MEMBERSHIP_ID]: memberships.map((membership) => ({
                            id: membership.product_id,
                            label: membership.product.name,
                        })),
                    }}
                    editable={true}
                    readOnly={false}
                />
                <Button onClick={() => setAddMembershipDialogOpen(null)}>
                    {GlobalLanguageTranslations.cancel[language]}
                </Button>
            </Dialog>
            <Dialog
                open={!!editBlacklistEntryUser}
                onClose={() => setEditBlacklistEntryUser(null)}
                fullWidth
                maxWidth="md"
                fullScreen={isSmallScreen}
            >
                <Form
                    name={GlobalConstants.BLACKLIST_ENTRY}
                    validationSchema={BlacklistEntryCreateSchema}
                    action={upsertUserBlacklistEntryAction}
                    {...(editBlacklistEntryUser?.blacklist_entry && {
                        defaultValues: editBlacklistEntryUser.blacklist_entry,
                    })}
                    editable={true}
                    readOnly={false}
                />
                {editBlacklistEntryUser?.blacklist_entry && (
                    <ConfirmButton
                        onClick={deleteBlacklistEntryAction}
                        buttonProps={{ color: "error" }}
                    >
                        {LanguageTranslations.deleteBlacklistEntry[language]}
                    </ConfirmButton>
                )}
                <Button onClick={() => setEditBlacklistEntryUser(null)}>
                    {GlobalLanguageTranslations.cancel[language]}
                </Button>
            </Dialog>
        </Stack>
    );
};

export default MembersDashboard;
