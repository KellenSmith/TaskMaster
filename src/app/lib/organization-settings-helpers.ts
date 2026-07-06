import { Prisma } from "../../prisma/generated/client";
import { prisma } from "../../prisma/prisma-client";

export const getOrganizationSettings = async (): Promise<
    Prisma.OrganizationSettingsGetPayload<true>
> => {
    let orgSettings = await prisma.organizationSettings.findFirst();
    if (orgSettings) return orgSettings;
    return {
        id: "default",
        logo_url: null,
        remind_membership_expires_in_days: 7,
        purge_members_after_days_unvalidated: 180,
        default_task_shift_length: 2,
        member_application_prompt: null,
        event_manager_email: null,
        primary_color: "#607d8b",
        privacy_policy_swedish_url: null,
        privacy_policy_english_url: null,
        terms_of_purchase_swedish_url: null,
        terms_of_purchase_english_url: null,
        terms_of_membership_swedish_url: null,
        terms_of_membership_english_url: null,
        payment_instructions: null,
    };
};
