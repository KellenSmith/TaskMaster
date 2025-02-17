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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import { redirect } from "next/navigation";
import GlobalConstants from "../GlobalConstants";
import { useUserContext } from "../context/UserContext";
import { isUserAuthorized, routes, routesToPath } from "../lib/definitions";

const NavPanel = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logOut } = useUserContext();

  const toggleDrawerOpen = () => {
    setDrawerOpen((prev) => !prev);
  };

  const getLinkGroup = (privacyStatus: string) => {
    return (
      <List>
        {routesToPath(routes[privacyStatus])
          .filter((route) => isUserAuthorized(route, user))
          .map((route) => (
            <ListItem key={route}>
              <Button onClick={()=>redirect(route)}>
                {route}
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
          {user && (
            <Button onClick={toggleDrawerOpen}>
              <MenuIcon />
            </Button>
          )}
          <Typography
            variant="h6"
            style={{ flexGrow: 1, textAlign: "center", cursor: "pointer" }}
            onClick={() => redirect("/")}
          >
            LOGO
          </Typography>
          {user ? (
            <Button onClick={logOut}>
              <LogoutIcon />
            </Button>
          ) : (
            <Button onClick={() => redirect(`/${GlobalConstants.LOGIN}`)}>
              <LoginIcon />
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawerOpen}>
        <Button onClick={toggleDrawerOpen}>
          <MenuOpenIcon />
        </Button>
        {getLinkGroup(GlobalConstants.PRIVATE)}
        {getLinkGroup(GlobalConstants.ADMIN)}
      </Drawer>
    </>
  );
};

export default NavPanel;
