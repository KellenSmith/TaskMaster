'use client'

import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import GlobalConstants from '../GlobalConstants';
import { useUserContext } from '../context/UserContext';
import { routes } from '../lib/definitions';
import { isUserAuthorized } from '../lib/utils';

const NavPanel = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const {user, setUser} = useUserContext();

    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleLogout = async () => {
        setUser(null);
        redirect(`${GlobalConstants.LOGIN}`)
    };

    console.log(user)

    const getLinkGroup = (privacyStatus: string) => {
        return (
            <List>
                {routes[privacyStatus].map((route) => (
                    isUserAuthorized(route, user) && (
                        <ListItem key={route}>
                            <Button LinkComponent={Link} href={route}>{route}</Button>
                        </ListItem>
                    )
                ))}
            </List>
        )
    }

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    {user && <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleDrawerToggle}><MenuIcon /></IconButton>}
                    <Typography variant="h6" style={{ flexGrow: 1, textAlign: 'center' }}>
                        LOGO
                    </Typography>
                    {user && (
                        <Button color="inherit" onClick={handleLogout}>
                            <LogoutIcon />
                        </Button>
                    )}
                </Toolbar>
            </AppBar>
            <Drawer anchor="left" open={drawerOpen} onClose={handleDrawerToggle}>
                {getLinkGroup(GlobalConstants.PUBLIC)}
                {getLinkGroup(GlobalConstants.PRIVATE)}
                {getLinkGroup(GlobalConstants.ADMIN)}
            </Drawer>
        </>
    );
};

export default NavPanel;