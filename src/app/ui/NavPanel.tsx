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
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import GlobalConstants from "../GlobalConstants";
import { useUserContext } from "../context/UserContext";
import {
    isUserAdmin,
    isUserAuthorized,
    applicationRoutes,
    routeToPath,
    clientRedirect,
    snakeCaseToLabel,
} from "../lib/definitions";
import { Article, Cancel, Edit } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { openResourceInNewTab } from "./utils";
import { useOrganizationSettingsContext } from "../context/OrganizationSettingsContext";
import { useNotificationContext } from "../context/NotificationContext";
import { logOut } from "../lib/user-credentials-actions";
import LanguageMenu from "./LanguageMenu";

const NavPanel = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { user, editMode, setEditMode, refreshSession, language, setLanguage } = useUserContext();
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
            addNotification("Failed to log out", "error");
        } catch (error) {
            // Catch redirect exception and refresh session before moving on.
            if (error?.digest?.startsWith("NEXT_REDIRECT")) {
                refreshSession();
                throw error;
            }
        }
    };

    const hiddenRoutes = [
        GlobalConstants.LOGIN,
        GlobalConstants.RESET,
        GlobalConstants.APPLY,
        GlobalConstants.ORDER,
    ];

    const getLinkGroup = (privacyStatus: string) => {
        const authorizedRoutes = applicationRoutes[privacyStatus]
            .filter((route) => !hiddenRoutes.includes(route))
            .filter((route) => isUserAuthorized(routeToPath(route), user));
        if (authorizedRoutes.length === 0) return null;
        return (
            <Stack key={privacyStatus}>
                {privacyStatus !== GlobalConstants.PUBLIC && (
                    <ListSubheader sx={{ textTransform: "capitalize" }}>
                        {privacyStatus}s only
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
                            {snakeCaseToLabel(route)}
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
                    <LanguageMenu language={language} setLanguage={setLanguage} />
                    <Tooltip title="Open README.md">
                        <Button onClick={() => openResourceInNewTab("/README.pdf")}>
                            <Article />
                        </Button>
                    </Tooltip>
                    {isUserAdmin(user) && (
                        <Tooltip title={`${editMode ? "Disable" : "Enable"} website edit mode`}>
                            <Button onClick={() => setEditMode((prev: boolean) => !prev)}>
                                {editMode ? <Cancel /> : <Edit />}
                            </Button>
                        </Tooltip>
                    )}
                    {user ? (
                        <Button onClick={logOutAction}>
                            <LogoutIcon />
                        </Button>
                    ) : (
                        <Button onClick={() => clientRedirect(router, [GlobalConstants.LOGIN])}>
                            <LoginIcon />
                        </Button>
                    )}
                </Toolbar>
            </AppBar>
            <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawerOpen}>
                <Button sx={{ justifyContent: "flex-end" }} onClick={toggleDrawerOpen}>
                    <MenuOpenIcon />
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
