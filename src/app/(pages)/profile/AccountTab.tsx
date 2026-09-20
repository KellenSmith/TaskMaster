"use client";

import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { useUserContext } from "../../context/UserContext";
import { deleteUser, logOut, updateUser } from "../../lib/user-actions";
import { Button, Stack } from "@mui/material";
import ConfirmButton from "../../ui/ConfirmButton";
import { allowRedirectException } from "../../ui/utils";
import { useNotificationContext } from "../../context/NotificationContext";
import { UserUpdateSchema } from "../../lib/zod-schemas";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoadingFallback } from "../../ui/ErrorBoundarySuspense";
import MembershipStatusCard from "./MembershipStatusCard";
import RenewMembershipButton from "../../ui/RenewMembershipButton";
import { useMembershipState } from "../../lib/use-membership-state";
import { MembershipState, MembershipStateType } from "../../lib/membership-utils";
import { clientRedirect } from "../../lib/utils";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import MembershipLanguageTranslations from "../../lib/membership-language-translations";
import LanguageTranslations from "./LanguageTranslations";
import { Prisma } from "../../../prisma/generated/browser";

interface AccountTabProps {
    membershipProductPromise: Promise<Prisma.ProductGetPayload<{ select: { name: true } }> | null>;
}

const AccountTab = ({ membershipProductPromise }: AccountTabProps) => {
    const { user, language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();
    const { state: membershipState } = useMembershipState();
    const router = useRouter();

    if (!user) return <LoadingFallback />;

    const updateUserProfile = async (formData: FormData) => {
        try {
            await updateUser(user.id, formData);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const deleteMyAccount = async () =>
        startTransition(async () => {
            try {
                await deleteUser(user.id);
                await logOut();
            } catch (error) {
                allowRedirectException(error);
                addNotification(GlobalLanguageTranslations.failedDelete[language], "error");
            }
        });

    // Only members who need to act get the primary CTA; an active member has nothing to renew yet.
    const showRenew = (
        [
            MembershipState.awaitingPayment,
            MembershipState.expired,
            MembershipState.expiringSoon,
        ] as MembershipStateType[]
    ).includes(membershipState);
    // Blacklisted and not-yet-approved members cannot buy anything, so hide the shop link too.
    const canBrowseShop = showRenew || membershipState === MembershipState.active;

    return (
        <Stack spacing={2}>
            <MembershipStatusCard membershipProductPromise={membershipProductPromise} />
            {showRenew && (
                <RenewMembershipButton state={membershipState} disabled={isPending} fullWidth />
            )}
            {canBrowseShop && (
                <Button
                    variant="text"
                    size="small"
                    onClick={() => clientRedirect(router, [GlobalConstants.SHOP])}
                >
                    {MembershipLanguageTranslations.browseOtherMemberships[language]}
                </Button>
            )}
            <Form
                name={GlobalConstants.PROFILE}
                buttonLabel={GlobalLanguageTranslations.save[language]}
                action={updateUserProfile}
                validationSchema={UserUpdateSchema}
                defaultValues={user}
            ></Form>

            <ConfirmButton
                buttonProps={{
                    color: "error",
                    disabled: isPending,
                }}
                onClick={deleteMyAccount}
            >
                {LanguageTranslations.deleteAccount[language]}
            </ConfirmButton>
        </Stack>
    );
};

export default AccountTab;
