"use client";
import { useState } from "react";
import { SkillBadge } from "@prisma/client";
import Image from "next/image";
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Tooltip,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Avatar,
} from "@mui/material";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { Shield } from "@mui/icons-material";

interface SkillBadgeProps {
    badge: SkillBadge;
    onClick?: () => void;
}

const SkillBadgeCard = ({ badge, onClick }: SkillBadgeProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Card
                sx={{
                    maxWidth: 250,
                    width: "fit-content",
                    cursor: "pointer",
                }}
                onClick={onClick || (() => setIsOpen(true))}
            >
                <CardMedia sx={{ paddingTop: 2, position: "relative" }}>
                    <Image
                        src={badge.imageUrl || "/images/badge-placeholder.svg"}
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
            <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{badge.name}</DialogTitle>
                <DialogContent>
                    <Stack direction="row" spacing={4}>
                        <Image
                            src={badge.imageUrl || "/images/badge-placeholder.svg"}
                            alt={badge.name}
                            width={400}
                            height={200}
                            style={{
                                objectFit: "contain",
                                maxHeight: 250,
                                maxWidth: 250,
                            }}
                        />
                        <Typography color="text.secondary">{badge.description}</Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default SkillBadgeCard;
