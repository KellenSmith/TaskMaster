'use client'

import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import GlobalConstants from '../GlobalConstants';

const routes = [
    { path: '/members', name: 'Members' },
    { path: '/profile', name: 'Profile' },
    // Add more routes as needed
];

const isUserAuthorized = (user, route) => {
    // Implement your authorization logic here
    return true;
};

const NavPanel = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [user, setUser] = useState();

    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleLogout = async () => {
        setUser(null);
        redirect(`${GlobalConstants.LOGIN}`)
    };

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    {user && <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleDrawerToggle}>
                        <MenuIcon />
                    </IconButton>}
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
                <List>
                    {routes.map((route) => (
                        isUserAuthorized(user, route) && (
                            <ListItem key={route.path}>
                                <Button LinkComponent={Link} href={route.path}>{route.name}</Button>
                            </ListItem>
                        )
                    ))}
                </List>
            </Drawer>
        </>
    );
};

export default NavPanel;