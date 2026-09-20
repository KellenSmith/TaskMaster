"use client";
import { ReactNode, FC } from "react";
import ThemeContextProvider from "./ThemeContext";
import UserContextProvider from "./UserContext";
import OrganizationSettingsProvider from "./OrganizationSettingsContext";
import NotificationContextProvider from "./NotificationContext";
import LocalizationContextProvider from "./LocalizationContext";
import UpcomingTicketsProvider from "./UpcomingTicketsContext";
import ErrorBoundarySuspense from "../ui/ErrorBoundarySuspense";
import { SessionProvider } from "next-auth/react";
import { Prisma } from "../../prisma/generated/browser";

type UpcomingTicket = Prisma.EventParticipantGetPayload<{
    include: {
        ticket: {
            include: {
                event: {
                    select: {
                        id: true;
                        title: true;
                        start_time: true;
                        end_time: true;
                        location: { select: { name: true } };
                    };
                };
            };
        };
    };
}>;

interface ContextWrapperProps {
    children: ReactNode;
    organizationSettingsPromise: Promise<Prisma.OrganizationSettingsGetPayload<true>>;
    userPromise: Promise<Prisma.UserGetPayload<{
        include: { user_membership: true; skill_badges: true; blacklist_entry: true };
    }> | null>;
    infoPagesPromise: Promise<
        Prisma.InfoPageGetPayload<{
            include: { titleText: { include: { translations: true } } };
        }>[]
    >;
    upcomingTicketsPromise: Promise<UpcomingTicket[]>;
    handlePaymentsManually: boolean;
}

const ContextWrapper: FC<ContextWrapperProps> = ({
    children,
    organizationSettingsPromise,
    infoPagesPromise,
    upcomingTicketsPromise,
    userPromise,
    handlePaymentsManually,
}) => {
    return (
        <ErrorBoundarySuspense>
            <LocalizationContextProvider>
                <OrganizationSettingsProvider
                    organizationSettingsPromise={organizationSettingsPromise}
                    infopagesPromise={infoPagesPromise}
                    handlePaymentsManually={handlePaymentsManually}
                >
                    <ThemeContextProvider>
                        <NotificationContextProvider>
                            <SessionProvider>
                                <UserContextProvider userPromise={userPromise}>
                                    <UpcomingTicketsProvider
                                        upcomingTicketsPromise={upcomingTicketsPromise}
                                    >
                                        {children}
                                    </UpcomingTicketsProvider>
                                </UserContextProvider>
                            </SessionProvider>
                        </NotificationContextProvider>
                    </ThemeContextProvider>
                </OrganizationSettingsProvider>
            </LocalizationContextProvider>
        </ErrorBoundarySuspense>
    );
};

export default ContextWrapper;
