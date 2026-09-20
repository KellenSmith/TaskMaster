"use client";

import { createContext, FC, ReactNode, use, useContext } from "react";
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

interface UpcomingTicketsContextValue {
    upcomingTicketsPromise: Promise<UpcomingTicket[]>;
}

export const UpcomingTicketsContext = createContext<UpcomingTicketsContextValue | null>(null);

export const useUpcomingTicketsContext = (): UpcomingTicketsContextValue => {
    const context = useContext(UpcomingTicketsContext);
    if (!context)
        throw new Error("useUpcomingTicketsContext must be used within UpcomingTicketsProvider");
    return context;
};

/**
 * Resolves the promise for consumers that want the tickets directly.
 * Call this inside a Suspense boundary - the provider deliberately does not
 * await, so an unresolved ticket query never blocks the app shell.
 */
export const useUpcomingTickets = (): UpcomingTicket[] => {
    const { upcomingTicketsPromise } = useUpcomingTicketsContext();
    return use(upcomingTicketsPromise);
};

interface UpcomingTicketsProviderProps {
    upcomingTicketsPromise: Promise<UpcomingTicket[]>;
    children: ReactNode;
}

const UpcomingTicketsProvider: FC<UpcomingTicketsProviderProps> = ({
    upcomingTicketsPromise,
    children,
}) => (
    <UpcomingTicketsContext.Provider value={{ upcomingTicketsPromise }}>
        {children}
    </UpcomingTicketsContext.Provider>
);

export default UpcomingTicketsProvider;
