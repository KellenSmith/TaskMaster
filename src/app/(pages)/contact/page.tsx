import { Stack, Typography } from "@mui/material";
import React from "react";
import GlobalConstants from "../../GlobalConstants";
import TextContent from "../../ui/TextContent";

const ContactPage: React.FC = () => {
    return (
        <Stack sx={{ height: "100%", justifyContent: "center", alignItems: "center" }}>
            <Typography textAlign="center" color="primary" variant="h3">
                Contact
            </Typography>
            <TextContent id={GlobalConstants.CONTACT} richText={true} />
        </Stack>
    );
};

export default ContactPage;
