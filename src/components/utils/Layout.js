import React, { useState, useEffect, useRef } from 'react';

import { Grid, Paper, Typography } from '@mui/material';

const Layout = ({ children }) => (
    <Grid container spacing={2} sx={{ padding: 2 }}>
        <Grid item xs={12} md={3}>
            <Paper elevation={3} sx={{ padding: 2 }}>
                <Typography variant="h6">Sidebar</Typography>
                {/* Contenu de la sidebar */}
            </Paper>
        </Grid>
        <Grid item xs={12} md={9}>
            <Paper elevation={3} sx={{ padding: 2 }}>
                <Typography variant="h6">Main Content</Typography>
                {children}
            </Paper>
        </Grid>
    </Grid>
);

export default Layout;