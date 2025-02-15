'use client'

import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Drawer, List, ListItem, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import GlobalConstants from '../GlobalConstants';
import { useUserContext } from '../context/UserContext';
import { routes } from '../lib/definitions';
import { isUserAuthorized } from '../lib/utils';

const NavPanel = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const {user, logOut} = useUserContext();

    const toggleDrawerOpen = () => {
        setDrawerOpen(prev => !prev);
    };

    const getLinkGroup = (privacyStatus: string) => {
        return (
            <List>
                {routes[privacyStatus].filter(route=>isUserAuthorized(route, user)).map((route) => (
                        <ListItem key={route}>
                            <Button LinkComponent={Link} href={`/${route}`}>{route}</Button>
                        </ListItem>
                ))}
            </List>
        )
    }

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    {user && <Button  onClick={toggleDrawerOpen}><MenuIcon /></Button>}
                    <Typography 
                        variant="h6" 
                        style={{ flexGrow: 1, textAlign: 'center', cursor: 'pointer' }} 
                        onClick={() => redirect('/')}
                    >
                        LOGO
                    </Typography>
                    {user ? 
                        <Button onClick={logOut}>
                            <LogoutIcon />
                        </Button>
                        : <Button onClick={()=>redirect(`/${GlobalConstants.LOGIN}`)}>
                            <LoginIcon/>
                        </Button>
                    }
                </Toolbar>
            </AppBar>
            <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawerOpen}>
                <Button onClick={toggleDrawerOpen}><MenuOpenIcon/></Button>
                {getLinkGroup(GlobalConstants.PUBLIC)}
                {getLinkGroup(GlobalConstants.PRIVATE)}
                {getLinkGroup(GlobalConstants.ADMIN)}
            </Drawer>
        </>
    );
};

export default NavPanel;