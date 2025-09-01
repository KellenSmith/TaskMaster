"use client";
import { useState } from "react";
import { SkillBadge } from "@prisma/client";
import Image from "next/image";
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import RichTextField from "../../ui/form/RichTextField";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import { useUserContext } from "../../context/UserContext";

interface SkillBadgeProps {
    badge: SkillBadge;
    onClick?: () => void;
    greyedOut?: boolean;
}

const SkillBadgeCard = ({ badge, onClick, greyedOut = false }: SkillBadgeProps) => {
    const { language } = useUserContext();
    const [isOpen, setIsOpen] = useState(false);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <>
            <Card
                sx={{
                    maxWidth: 250,
                    width: "fit-content",
                    cursor: "pointer",
                    transition: "filter 200ms, opacity 200ms",
                    filter: greyedOut ? "grayscale(100%)" : "none",
                    opacity: greyedOut ? 0.5 : 1,
                }}
                onClick={onClick || (() => setIsOpen(true))}
            >
                <CardMedia sx={{ paddingTop: 2, position: "relative" }}>
                    <Image
                        src={badge.image_url || "/images/badge-placeholder.svg"}
                        alt={badge.name}
                        width={400}
                        height={200}
                        style={{
                            objectFit: "contain",
                            maxHeight: 250,
                            maxWidth: 250,
                        }}
                    />
                </CardMedia>
                <CardContent>
                    <Typography textAlign="center" variant="h6">
                        {badge.name}
                    </Typography>
                </CardContent>
            </Card>
            <Dialog
                fullScreen={isSmallScreen}
                open={isOpen}
                onClose={() => setIsOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>{badge.name}</DialogTitle>
                <DialogContent>
                    <Stack direction="row" width="100%" spacing={4}>
                        <Image
                            src={badge.image_url || "/images/badge-placeholder.svg"}
                            alt={badge.name}
                            width={400}
                            height={200}
                            style={{
                                objectFit: "contain",
                                maxHeight: 250,
                                maxWidth: 250,
                            }}
                        />
                        <RichTextField defaultValue={badge.description} editMode={false} />
                    </Stack>
                </DialogContent>
                <Button onClick={() => setIsOpen(false)}>
                    {GlobalLanguageTranslations.cancel[language]}
                </Button>
            </Dialog>
        </>
    );
};

export default SkillBadgeCard;
