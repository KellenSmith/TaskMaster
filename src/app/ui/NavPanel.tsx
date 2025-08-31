"use client";

import React, { useState } from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    Drawer,
    List,
    ListItem,
    Button,
    Tooltip,
    ListSubheader,
    Stack,
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
import { Article, Cancel, Edit } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { openResourceInNewTab } from "./utils";
import { useOrganizationSettingsContext } from "../context/OrganizationSettingsContext";
import { useNotificationContext } from "../context/NotificationContext";
import { logOut } from "../lib/user-credentials-actions";
import LanguageMenu from "./LanguageMenu";
import LanguageTranslations from "./LanguageTranslations";
import { UserRole } from "@prisma/client";
import GlobalLanguageTranslations from "../GlobalLanguageTranslations";
import LoginLanguageTranslations from "../(pages)/login/LanguageTranslations";

const NavPanel = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
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
        } catch (error) {
            // Catch redirect exception and refresh session before moving on.
            if (error?.digest?.startsWith("NEXT_REDIRECT")) {
                refreshSession();
                throw error;
            }
        }
    };

    const hiddenRoutes = [
        GlobalConstants.HOME,
        GlobalConstants.LOGIN,
        GlobalConstants.RESET,
        GlobalConstants.APPLY,
        GlobalConstants.ORDER,
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
                    <Button onClick={toggleDrawerOpen}>
                        <MenuIcon />
                    </Button>
                    <Typography
                        variant="h6"
                        style={{ flexGrow: 1, textAlign: "center", cursor: "pointer" }}
                        onClick={() => clientRedirect(router, [GlobalConstants.HOME])}
                    >
                        {organizationSettings?.organization_name || "Organization Name"}
                    </Typography>
                    <LanguageMenu />
                    <Tooltip title={`${GlobalLanguageTranslations.open[language]} README.md`}>
                        <Button onClick={() => openResourceInNewTab("/README.pdf")}>
                            <Article />
                        </Button>
                    </Tooltip>
                    {isUserAdmin(user) && (
                        <Tooltip
                            title={LanguageTranslations.toggleAdminEditMode[language](editMode)}
                        >
                            <Button onClick={() => setEditMode((prev: boolean) => !prev)}>
                                {editMode ? <Cancel /> : <Edit />}
                            </Button>
                        </Tooltip>
                    )}
                    {!user && (
                        <Button
                            variant="outlined"
                            sx={{ marginX: 2 }}
                            onClick={() => clientRedirect(router, [GlobalConstants.APPLY])}
                        >
                            {LoginLanguageTranslations.applyForMembership[language]}
                        </Button>
                    )}
                    <Tooltip title={LanguageTranslations.toggleLoggedIn[language](!!user)}>
                        {user ? (
                            <Button
                                variant="outlined"
                                onClick={logOutAction}
                                endIcon={<LogoutIcon />}
                            >
                                {LoginLanguageTranslations.logout[language]}
                            </Button>
                        ) : (
                            <Button
                                variant="outlined"
                                onClick={() => clientRedirect(router, [GlobalConstants.LOGIN])}
                                endIcon={<LoginIcon />}
                            >
                                {LoginLanguageTranslations.login[language]}
                            </Button>
                        )}
                    </Tooltip>
                </Toolbar>
            </AppBar>
            <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawerOpen}>
                <Button variant="outlined" onClick={toggleDrawerOpen}>
                    {GlobalLanguageTranslations.close[language]}
                </Button>
                <List>
                    {Object.keys(applicationRoutes).map((privacyStatus) =>
                        getLinkGroup(privacyStatus),
                    )}
                </List>
            </Drawer>
        </>
    );
};

export default NavPanel;
