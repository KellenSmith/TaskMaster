import { ReactNode, FC } from "react";
import ContextWrapper from "./ContextWrapper";
import { getOrganizationSettings } from "../lib/organization-settings-helpers";
import { getLoggedInUser } from "../lib/user-helpers";
import { prisma } from "../../prisma/prisma-client";
import { userHasRolePrivileges } from "../lib/auth/auth-utils";
import { UserRole } from "../../prisma/generated/enums";
import { Prisma } from "../../prisma/generated/browser";

let hasLoggedBuildFallbackForInfoPages = false;
let hasLoggedBuildFallbackForOrgSettings = false;

const isBuildPhase = (): boolean => process.env.NEXT_PHASE === "phase-production-build";

const isExpectedDynamicServerUsageError = (error: unknown): boolean => {
    if (!error || typeof error !== "object") {
        return false;
    }

    const dynamicError = error as { digest?: string; description?: string };
    return (
        dynamicError.digest === "DYNAMIC_SERVER_USAGE" ||
        dynamicError.description?.includes("Dynamic server usage") === true
    );
};

const isExpectedBuildTimeDatabaseError = (error: unknown): boolean => {
    if (!error || typeof error !== "object") {
        return false;
    }

    const dbError = error as { code?: string; message?: string };
    return (
        dbError.code === "ETIMEDOUT" ||
        dbError.code === "ECONNREFUSED" ||
        dbError.code === "P1001" ||
        dbError.message?.includes("Can't reach database server") === true
    );
};

const createBuildFallbackOrganizationSettings = (): Prisma.OrganizationSettingsGetPayload<true> => {
    return {
        id: "build-fallback",
        logo_url: null,
        remind_membership_expires_in_days: 7,
        purge_members_after_days_unvalidated: 180,
        default_task_shift_length: 2,
        member_application_prompt: null,
        ticket_instructions: null,
        event_manager_email: null,
        primary_color: "#607d8b",
        privacy_policy_swedish_url: null,
        privacy_policy_english_url: null,
        terms_of_purchase_swedish_url: null,
        terms_of_purchase_english_url: null,
        terms_of_membership_swedish_url: null,
        terms_of_membership_english_url: null,
    };
};

interface ServerContextWrapperProps {
    children: ReactNode;
}

const ServerContextWrapper: FC<ServerContextWrapperProps> = async ({ children }) => {
    if (isBuildPhase()) {
        if (!hasLoggedBuildFallbackForInfoPages) {
            hasLoggedBuildFallbackForInfoPages = true;
            console.warn(
                "Using build-time fallback for info pages because database is not reachable.",
            );
        }
        if (!hasLoggedBuildFallbackForOrgSettings) {
            hasLoggedBuildFallbackForOrgSettings = true;
            console.warn(
                "Using build-time fallback for organization settings because database is not reachable.",
            );
        }

        return (
            <ContextWrapper
                organizationSettingsPromise={Promise.resolve(
                    createBuildFallbackOrganizationSettings(),
                )}
                userPromise={Promise.resolve(null)}
                infoPagesPromise={Promise.resolve([])}
            >
                {children}
            </ContextWrapper>
        );
    }

    let loggedInUser = null;
    try {
        loggedInUser = await getLoggedInUser();
    } catch (error) {
        if (!isExpectedDynamicServerUsageError(error)) {
            console.error("Error fetching logged in user:", error);
        }
    }

    const allowedUserRolePrivileges = Object.values(UserRole).filter((role) =>
        userHasRolePrivileges(loggedInUser, role),
    ) as UserRole[];

    // Pages with no role restrictions are always allowed
    const lowestAllowedUserRoleCondition: Prisma.InfoPageWhereInput & {
        OR: Prisma.InfoPageWhereInput[];
    } = { OR: [{ lowest_allowed_user_role: { equals: null } }] };
    if (allowedUserRolePrivileges.length > 0) {
        lowestAllowedUserRoleCondition.OR.push({
            lowest_allowed_user_role: { in: allowedUserRolePrivileges },
        });
    }
    const infoPagesPromise = prisma.infoPage
        .findMany({
            where: lowestAllowedUserRoleCondition,
            include: { titleText: { include: { translations: true } } },
        })
        .catch((error) => {
            if (isExpectedBuildTimeDatabaseError(error)) {
                if (!hasLoggedBuildFallbackForInfoPages) {
                    hasLoggedBuildFallbackForInfoPages = true;
                    console.warn(
                        "Using build-time fallback for info pages because database is not reachable.",
                    );
                }
                return [];
            }
            throw error;
        });

    const organizationSettingsPromise = getOrganizationSettings().catch((error) => {
        if (isExpectedBuildTimeDatabaseError(error)) {
            if (!hasLoggedBuildFallbackForOrgSettings) {
                hasLoggedBuildFallbackForOrgSettings = true;
                console.warn(
                    "Using build-time fallback for organization settings because database is not reachable.",
                );
            }
            return createBuildFallbackOrganizationSettings();
        }
        throw error;
    });

    return (
        <ContextWrapper
            organizationSettingsPromise={organizationSettingsPromise}
            userPromise={new Promise((resolve) => resolve(loggedInUser))}
            infoPagesPromise={infoPagesPromise}
        >
            {children}
        </ContextWrapper>
    );
};

export default ServerContextWrapper;
