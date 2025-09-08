"use client";

import React, { useMemo, useState } from "react";
import {
    AppBar,
    Toolbar,
    Box,
    List,
    ListItem,
    Button,
    Divider,
    IconButton,
    SwipeableDrawer,
    ListSubheader,
    Stack,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import GlobalConstants from "../GlobalConstants";
import { useUserContext } from "../context/UserContext";
import { isUserAdmin, clientRedirect, pathToRoutes } from "../lib/utils";
import { Cancel, ChevronLeft, Edit } from "@mui/icons-material";
import { usePathname, useRouter } from "next/navigation";
import { useOrganizationSettingsContext } from "../context/OrganizationSettingsContext";
import { useNotificationContext } from "../context/NotificationContext";
import LanguageMenu from "./LanguageMenu";
import LanguageTranslations from "./LanguageTranslations";
import LoginLanguageTranslations from "../(pages)/login/LanguageTranslations";
import Image from "next/image";
import { isUserAuthorized, RouteConfigType, routeTreeConfig } from "../lib/auth/auth-utils";
import { logOut } from "../lib/user-actions";

const NavPanel = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const isIOSDevice = useMemo(
        () => typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent),
        [],
    );
    const { user, editMode, setEditMode, language } = useUserContext();
    const { organizationSettings } = useOrganizationSettingsContext();
    const { addNotification } = useNotificationContext();
    const router = useRouter();
    const pathname = usePathname();

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
                setDrawerOpen(false);
                throw error;
            }
        }
    };

    const hiddenRoutes = [
        GlobalConstants.HOME,
        GlobalConstants.LOGIN,
        GlobalConstants.ORDER,
        GlobalConstants.TASK,
        GlobalConstants.APPLY,
        GlobalConstants.EVENT,
    ];

    const getRouteNavButton = (routeConfig: RouteConfigType, currentPathSegments: string[]) => {
        if (hiddenRoutes.includes(routeConfig.name)) return null;
        if (!isUserAuthorized(user, [routeConfig.name], routeConfig)) return null;
        return (
            <ListItem key={routeConfig.name} dense>
                <Button
                    fullWidth
                    sx={{ justifyContent: "flex-start" }}
                    onClick={() => {
                        setDrawerOpen(false);
                        clientRedirect(router, [routeConfig.name]);
                    }}
                >
                    {LanguageTranslations.routeLabel[routeConfig.name][language]}
                </Button>
                {routeConfig.children.length > 0 && (
                    <List>
                        {routeConfig.children.map((child) =>
                            getRouteNavButton(child, currentPathSegments.slice(1)),
                        )}
                    </List>
                )}
            </ListItem>
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
                            priority={true}
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
                    {[
                        ...new Set(routeTreeConfig.children.map((childRoute) => childRoute.role)),
                    ].map((role) => {
                        const routesForRole = routeTreeConfig.children.filter(
                            (childRoute) => childRoute.role === role,
                        );
                        return (
                            <Stack key={role} spacing={1} sx={{ mb: 2 }}>
                                {role && (
                                    <ListSubheader>
                                        {LanguageTranslations.roleLabels[role][language]}
                                    </ListSubheader>
                                )}
                                {routesForRole.map((route) =>
                                    getRouteNavButton(route, pathToRoutes(pathname)),
                                )}
                            </Stack>
                        );
                    })}
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
