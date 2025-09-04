"use client";

import React, { useMemo, useState } from "react";
import {
    AppBar,
    Toolbar,
    Box,
    List,
    ListItem,
    Button,
    ListSubheader,
    Stack,
    Divider,
    IconButton,
    SwipeableDrawer,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import GlobalConstants from "../GlobalConstants";
import { useUserContext } from "../context/UserContext";
import {
    isUserAdmin,
    isUserAuthorized,
    applicationRoutes,
    routeToPath,
    clientRedirect,
} from "../lib/definitions";
import { Cancel, ChevronLeft, Edit } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useOrganizationSettingsContext } from "../context/OrganizationSettingsContext";
import { useNotificationContext } from "../context/NotificationContext";
import { logOut } from "../lib/user-credentials-actions";
import LanguageMenu from "./LanguageMenu";
import LanguageTranslations from "./LanguageTranslations";
import { UserRole } from "@prisma/client";
import LoginLanguageTranslations from "../(pages)/login/LanguageTranslations";
import Image from "next/image";

const NavPanel = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const isIOSDevice = useMemo(
        () => typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent),
        [],
    );
    const { user, editMode, setEditMode, refreshSession, language } = useUserContext();
    const { organizationSettings } = useOrganizationSettingsContext();
    const { addNotification } = useNotificationContext();
    const router = useRouter();

    const toggleDrawerOpen = () => {
        setDrawerOpen((prev) => !prev);
    };

    const logOutAction = async () => {
        try {
            await logOut();
            // If logout is successful, redirect exception is thrown
            // We do not expect to run this line
            addNotification(LanguageTranslations.failedToLogOut[language], "error");
            setDrawerOpen(false);
        } catch (error) {
            // Catch redirect exception and refresh session before moving on.
            if (error?.digest?.startsWith("NEXT_REDIRECT")) {
                refreshSession();
                setDrawerOpen(false);
                throw error;
            }
        }
    };

    const hiddenRoutes = [
        GlobalConstants.HOME,
        GlobalConstants.LOGIN,
        GlobalConstants.RESET,
        GlobalConstants.ORDER,
        GlobalConstants.TASK,
        ...(user ? [GlobalConstants.APPLY] : []),
    ];

    const getLinkGroup = (privacyStatus: UserRole | string) => {
        const authorizedRoutes = applicationRoutes[privacyStatus]
            .filter((route) => !hiddenRoutes.includes(route))
            .filter((route) => isUserAuthorized(routeToPath(route), user));
        if (authorizedRoutes.length === 0) return null;
        return (
            <Stack key={privacyStatus}>
                {privacyStatus !== GlobalConstants.PUBLIC && (
                    <ListSubheader sx={{ textTransform: "capitalize" }}>
                        {LanguageTranslations.restrictedRoute[privacyStatus as UserRole][language]}
                    </ListSubheader>
                )}
                {authorizedRoutes.map((route) => (
                    <ListItem key={route} dense>
                        <Button
                            fullWidth
                            sx={{ justifyContent: "flex-start" }}
                            onClick={() => {
                                setDrawerOpen(false);
                                clientRedirect(router, [route]);
                            }}
                        >
                            {LanguageTranslations.routeLabel[route][language]}
                        </Button>
                    </ListItem>
                ))}
            </Stack>
        );
    };

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="open navigation"
                        onClick={toggleDrawerOpen}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Image
                            src={organizationSettings?.logo_url || "/images/taskmaster-logo.svg"}
                            alt={organizationSettings?.organization_name || "TaskMaster"}
                            title={organizationSettings?.organization_name || "TaskMaster"}
                            height={40}
                            width={200}
                            style={{ cursor: "pointer" }}
                            onClick={() => clientRedirect(router, [GlobalConstants.HOME])}
                        />
                    </Box>
                    <LanguageMenu />
                </Toolbar>
            </AppBar>
            <SwipeableDrawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onOpen={() => setDrawerOpen(true)}
                disableBackdropTransition={isIOSDevice}
                disableDiscovery={isIOSDevice}
                slotProps={{ paper: { sx: { width: { xs: "85vw", sm: 320 } } } }}
            >
                <IconButton
                    sx={{ alignSelf: "flex-end", m: 1 }}
                    onClick={toggleDrawerOpen}
                    aria-label="close navigation"
                >
                    <ChevronLeft />
                </IconButton>
                <Divider />
                <List>
                    {user ? (
                        <Button
                            variant="outlined"
                            onClick={logOutAction}
                            endIcon={<LogoutIcon />}
                            fullWidth
                        >
                            {LoginLanguageTranslations.logout[language]}
                        </Button>
                    ) : (
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setDrawerOpen(false);
                                clientRedirect(router, [GlobalConstants.LOGIN]);
                            }}
                            endIcon={<LoginIcon />}
                            fullWidth
                        >
                            {LoginLanguageTranslations.login[language]}
                        </Button>
                    )}
                    {Object.keys(applicationRoutes).map((privacyStatus) =>
                        getLinkGroup(privacyStatus),
                    )}
                    {isUserAdmin(user) && (
                        <Button
                            fullWidth
                            aria-label={editMode ? "exit edit mode" : "enter edit mode"}
                            variant="outlined"
                            endIcon={editMode ? <Cancel /> : <Edit />}
                            onClick={() => setEditMode((prev: boolean) => !prev)}
                        >
                            {LanguageTranslations.toggleAdminEditMode[language](editMode)}
                        </Button>
                    )}
                </List>
            </SwipeableDrawer>
        </>
    );
};

export default NavPanel;
