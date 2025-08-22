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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import GlobalConstants from "../GlobalConstants";
import { useUserContext } from "../context/UserContext";
import { isUserAdmin, isUserAuthorized, routes, routesToPath } from "../lib/definitions";
import { Cancel, Edit } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { allowRedirectException, navigateToRoute } from "./utils";
import { useOrganizationSettingsContext } from "../context/OrganizationSettingsContext";
import { deleteUserCookieAndRedirectToHome } from "../lib/auth";
import { useNotificationContext } from "../context/NotificationContext";

const NavPanel = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { user, editMode, setEditMode } = useUserContext();
    const { organizationSettings } = useOrganizationSettingsContext();
    const { addNotification } = useNotificationContext();
    const router = useRouter();

    const toggleDrawerOpen = () => {
        setDrawerOpen((prev) => !prev);
    };

    const logOut = async () => {
        try {
            await deleteUserCookieAndRedirectToHome();
            addNotification("Successfully logged out", "success");
        } catch (error) {
            allowRedirectException(error);
            addNotification("Failed to log out", "error");
        }
    };

    const getLinkGroup = (privacyStatus: string) => {
        return (
            <List>
                {routesToPath(
                    routes[privacyStatus].filter(
                        (route) =>
                            ![
                                GlobalConstants.LOGIN,
                                GlobalConstants.RESET,
                                GlobalConstants.APPLY,
                                GlobalConstants.ORDER,
                                "order/complete",
                            ].includes(route),
                    ),
                )
                    .filter((route) => isUserAuthorized(route, user))
                    .map((route) => (
                        <ListItem key={route}>
                            <Button
                                onClick={() => {
                                    setDrawerOpen(false);
                                    navigateToRoute(route, router);
                                }}
                            >
                                {route.replace(/^\/+/, "").replace(/-/g, " ")}
                            </Button>
                        </ListItem>
                    ))}
            </List>
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
                        onClick={() => navigateToRoute("/", router)}
                    >
                        {organizationSettings?.organizationName || "Organization Name"}
                    </Typography>
                    {isUserAdmin(user) && (
                        <Tooltip title={`${editMode ? "Disable" : "Enable"} website edit mode`}>
                            <Button onClick={() => setEditMode((prev: boolean) => !prev)}>
                                {editMode ? <Cancel /> : <Edit />}
                            </Button>
                        </Tooltip>
                    )}
                    {user ? (
                        <Button onClick={logOut}>
                            <LogoutIcon />
                        </Button>
                    ) : (
                        <Button
                            onClick={() => navigateToRoute(`/${GlobalConstants.LOGIN}`, router)}
                        >
                            <LoginIcon />
                        </Button>
                    )}
                </Toolbar>
            </AppBar>
            <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawerOpen}>
                <Button onClick={toggleDrawerOpen}>
                    <MenuOpenIcon />
                </Button>
                {getLinkGroup(GlobalConstants.PUBLIC)}
                {getLinkGroup(GlobalConstants.PRIVATE)}
                {getLinkGroup(GlobalConstants.ADMIN)}
            </Drawer>
        </>
    );
};

export default NavPanel;
