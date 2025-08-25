"use client";

import { createContext, FC, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { Portal, Stack, Alert } from "@mui/material";

interface NotificationContextValue {
    // eslint-disable-next-line no-unused-vars
    addNotification: (msg: string, severity: "success" | "error" | "info" | "warning") => void;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (!context)
        throw new Error("useNotificationContext must be used within NotificationContextProvider");
    return context;
};

interface NotificationContextProviderProps {
    children: ReactNode;
}

interface NotificationToastProps {
    id: number;
    msg: string;
    severity: "success" | "error" | "info" | "warning";
    removeNotification: (id: number) => void; // eslint-disable-line no-unused-vars
}

const NotificationToast: FC<NotificationToastProps> = ({
    id,
    msg,
    severity,
    removeNotification,
}) => {
    const deleteThisNotification = useCallback(
        () => removeNotification(id),
        [id, removeNotification],
    );

    useEffect(() => {
        const timer = setTimeout(deleteThisNotification, 5000);
        return () => clearTimeout(timer);
    }, [deleteThisNotification]);

    return (
        <Alert severity={severity} onClose={deleteThisNotification}>
            {msg}
        </Alert>
    );
};

const NotificationContextProvider: FC<NotificationContextProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback(
        (msg: string, severity: "success" | "error" | "info" | "warning") => {
            const newNotificationId =
                notifications.length > 0 ? Math.max(...notifications.map((n) => n.id)) + 1 : 1;
            setNotifications((prev) => [...prev, { id: newNotificationId, msg, severity }]);
        },
        [notifications],
    );

    const removeNotification = useCallback((id: number) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                addNotification,
            }}
        >
            {children}

            <Portal>
                <Stack
                    spacing={1}
                    sx={{
                        position: "fixed",
                        top: 16,
                        right: 16,
                        zIndex: 9999,
                        maxWidth: 400,
                        width: "100%",
                        "@media (max-width: 600px)": {
                            left: 16,
                            right: 16,
                            maxWidth: "none",
                        },
                    }}
                >
                    {notifications.map((notification) => (
                        <NotificationToast
                            key={notification.id}
                            id={notification.id}
                            msg={notification.msg}
                            severity={notification.severity}
                            removeNotification={removeNotification}
                        />
                    ))}
                </Stack>
            </Portal>
        </NotificationContext.Provider>
    );
};

export default NotificationContextProvider;
