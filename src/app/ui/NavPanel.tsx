"use client";

import React, { use, useMemo, useState } from "react";
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
    Dialog,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import GlobalConstants from "../GlobalConstants";
import { useUserContext } from "../context/UserContext";
import { isUserAdmin, clientRedirect, pathToRoutes } from "../lib/utils";
import { Cancel, ChevronLeft, Delete, Edit } from "@mui/icons-material";
import { usePathname, useRouter } from "next/navigation";
import { useOrganizationSettingsContext } from "../context/OrganizationSettingsContext";
import { useNotificationContext } from "../context/NotificationContext";
import LanguageMenu from "./LanguageMenu";
import LanguageTranslations from "./LanguageTranslations";
import LoginLanguageTranslations from "../(pages)/login/LanguageTranslations";
import Image from "next/image";
import { isUserAuthorized, RouteConfigType, routeTreeConfig } from "../lib/auth/auth-utils";
import { logOut } from "../lib/user-actions";
import Form from "./form/Form";
import { InfoPageCreateSchema } from "../lib/zod-schemas";
import { createInfoPage, deleteInfoPage, updateInfoPage } from "../lib/info-page-actions";
import GlobalLanguageTranslations from "../GlobalLanguageTranslations";
import { allowRedirectException } from "./utils";
import { Prisma } from "@prisma/client";
import ConfirmButton from "./ConfirmButton";

const NavPanel = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const isIOSDevice = useMemo(
        () => typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent),
        [],
    );
    const { user, editMode, setEditMode, language } = useUserContext();
    const { organizationSettings, infopagesPromise } = useOrganizationSettingsContext();
    const { addNotification } = useNotificationContext();
    const router = useRouter();
    const pathname = usePathname();
    const [addInfoPageDialogOpen, setAddInfoPageDialogOpen] = useState(false);
    const [updateInfoPageId, setUpdateInfoPageId] = useState<string | null>(null);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
    const infoPages = use(infopagesPromise);

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

    const createInfoPageAction = async (formData: FormData) => {
        try {
            await createInfoPage(formData);
            setAddInfoPageDialogOpen(false);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch (error) {
            allowRedirectException(error);
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const updateInfoPageAction = async (formData: FormData) => {
        try {
            await updateInfoPage(formData, updateInfoPageId, language);
            setUpdateInfoPageId(null);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch (error) {
            allowRedirectException(error);
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
    };

    const deleteInfoPageAction = async (infoPageId: string) => {
        try {
            await deleteInfoPage(infoPageId);
            addNotification(GlobalLanguageTranslations.successfulDelete[language], "success");
        } catch (error) {
            allowRedirectException(error);
            addNotification(GlobalLanguageTranslations.failedDelete[language], "error");
        }
    };

    const getInfoPageNavButton = (
        infoPage: Prisma.InfoPageGetPayload<{
            include: { titleText: { include: { translations: true } } };
        }>,
    ) => {
        return (
            <ListItem key={infoPage.id} dense>
                <Button
                    fullWidth
                    sx={{ justifyContent: "flex-start" }}
                    onClick={() => {
                        setDrawerOpen(false);
                        clientRedirect(router, [GlobalConstants.INFO_PAGE], {
                            [GlobalConstants.INFO_PAGE_ID]: infoPage.id,
                        });
                    }}
                >
                    {getInfoPageTitle(infoPage)}
                </Button>
                {editMode && (
                    <Stack direction="row">
                        <Button
                            sx={{ minWidth: "20px" }}
                            onClick={() => setUpdateInfoPageId(infoPage.id)}
                        >
                            {<Edit fontSize="small" />}
                        </Button>
                        <ConfirmButton
                            sx={{ minWidth: "20px" }}
                            aria-label="delete info page"
                            onClick={() => deleteInfoPageAction(infoPage.id)}
                        >
                            <Delete fontSize="small" />
                        </ConfirmButton>
                    </Stack>
                )}
            </ListItem>
        );
    };

    const getInfoPageTitle = (infoPage: {
        titleText: { translations: { language: string; text: string }[] };
    }) => {
        const titleTextContent = infoPage?.titleText;
        if (!titleTextContent) return "No title";
        const titleInLanguage = titleTextContent.translations.find((t) => t.language === language);

        if (titleInLanguage && titleInLanguage.text.trim() !== "") return titleInLanguage.text;

        return infoPage.titleText.translations.find((t) => t.language === language)?.text || "";
    };

    const getInfoPageDefaultValues = (infoPageId: string | null) => {
        if (!infoPageId) return {};
        const infoPage = infoPages.find((ip) => ip.id === infoPageId);
        if (!infoPage) return {};
        return {
            [GlobalConstants.TITLE]: getInfoPageTitle(infoPage),
            ...infoPage,
        };
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
                            alt={process.env.NEXT_PUBLIC_ORG_NAME || "TaskMaster"}
                            title={process.env.NEXT_PUBLIC_ORG_NAME || "TaskMaster"}
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
                        const authorizedRoutes = routesForRole.filter((route) =>
                            isUserAuthorized(user, [route.name], route),
                        );
                        if (authorizedRoutes.length === 0) return null;
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
                                {infoPages
                                    .filter(
                                        (infoPage) => infoPage.lowest_allowed_user_role === role,
                                    )
                                    .map((infoPage) => getInfoPageNavButton(infoPage))}
                            </Stack>
                        );
                    })}
                    <Stack spacing={1}>
                        {editMode && (
                            <Button
                                fullWidth
                                aria-label="add info page"
                                variant="outlined"
                                onClick={() => setAddInfoPageDialogOpen(true)}
                            >
                                {LanguageTranslations.addInfoPage[language]}
                            </Button>
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
                    </Stack>
                </List>
            </SwipeableDrawer>
            <Dialog
                fullScreen={isSmallScreen}
                open={addInfoPageDialogOpen || !!updateInfoPageId}
                onClose={() => {
                    setAddInfoPageDialogOpen(false);
                    setUpdateInfoPageId(null);
                }}
                fullWidth
                maxWidth="xl"
            >
                <Form
                    name={GlobalConstants.INFO_PAGE}
                    validationSchema={InfoPageCreateSchema}
                    defaultValues={getInfoPageDefaultValues(updateInfoPageId)}
                    action={updateInfoPageId ? updateInfoPageAction : createInfoPageAction}
                    editable={true}
                    readOnly={false}
                />
                <Button fullWidth onClick={() => setAddInfoPageDialogOpen(false)}>
                    {GlobalLanguageTranslations.cancel[language]}
                </Button>
            </Dialog>
        </>
    );
};

export default NavPanel;
