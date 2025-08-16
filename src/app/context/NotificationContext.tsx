"use client";

import { createContext, FC, ReactNode, useContext, useEffect, useState } from "react";
import { Portal, Stack, Snackbar, Alert, IconButton, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export const NotificationContext = createContext(null);

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
    removeNotification: (id: number) => void;
}

const NotificationToast: FC<NotificationToastProps> = ({
    id,
    msg,
    severity,
    removeNotification,
}) => {
    const theme = useTheme();
    const deleteThisNotification = () => removeNotification(id);

    useEffect(() => {
        const timer = setTimeout(deleteThisNotification, 5000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <Alert severity={severity} onClose={deleteThisNotification}>
            {msg}
        </Alert>
    );
};

const NotificationContextProvider: FC<NotificationContextProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = (msg: string, severity: "success" | "error" | "info" | "warning") => {
        const newNotificationId =
            notifications.length > 0 ? Math.max(...notifications.map((n) => n.id)) + 1 : 1;
        setNotifications((prev) => [...prev, { id: newNotificationId, msg, severity }]);
    };

    const removeNotification = (id: number) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

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
