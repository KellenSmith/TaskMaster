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
import { LoadingFallback } from "../../ui/ErrorBoundarySuspense";
import MembershipStatusCard from "./MembershipStatusCard";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import LanguageTranslations from "./LanguageTranslations";
import { clientRedirect } from "../../lib/utils";
import { useMembershipState } from "../../lib/use-membership-state";
import { MembershipState, MembershipStateType } from "../../lib/membership-utils";
import { useRouter } from "next/navigation";
import { Prisma } from "../../../prisma/generated/browser";

interface AccountTabProps {
    membershipProductPromise: Promise<Prisma.ProductGetPayload<{ select: { name: true } }> | null>;
}

const AccountTab = ({ membershipProductPromise }: AccountTabProps) => {
    const { language } = useUserContext();
    const { state, user } = useMembershipState();
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();
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

    const membershipCtaLabel: Partial<Record<MembershipStateType, string>> = {
        [MembershipState.awaitingPayment]: LanguageTranslations.activateMembership[language],
        [MembershipState.expired]: LanguageTranslations.renewMembership[language],
        [MembershipState.expiringSoon]: LanguageTranslations.extendMembership[language],
        [MembershipState.active]: LanguageTranslations.extendMembership[language],
    };

    const getMembershipActionButton = () => {
        // No CTA for anonymous, blacklisted or not-yet-validated users
        const label = membershipCtaLabel[state];
        if (!label) return null;
        return (
            <Button
                onClick={() => clientRedirect(router, [GlobalConstants.SHOP])}
                disabled={isPending}
            >
                {label}
            </Button>
        );
    };

    return (
        <Stack>
            <MembershipStatusCard membershipProductPromise={membershipProductPromise} />
            {getMembershipActionButton()}
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
