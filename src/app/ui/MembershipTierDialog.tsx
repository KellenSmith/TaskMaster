"use client";

import {
    Button,
    Chip,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    Radio,
    RadioGroup,
    Stack,
    Typography,
} from "@mui/material";
import { useState } from "react";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { useUserContext } from "../context/UserContext";
import RichTextField from "./form/RichTextField";
import { MembershipProduct } from "../context/MembershipProductsContext";
import LanguageTranslations from "../lib/membership-language-translations";
import GlobalLanguageTranslations from "../GlobalLanguageTranslations";
import { formatPrice } from "./utils";

interface MembershipTierDialogProps {
    open: boolean;
    products: MembershipProduct[];
    selectedProductId: string;
    /** The membership the user holds today, if any. Marked in the list. */
    currentProductId?: string | null;
    isPending: boolean;
    onSelect: (productId: string) => void; // eslint-disable-line no-unused-vars
    onConfirm: () => void;
    onCancel: () => void;
}

/** Organization-authored rich text about a tier, collapsed until asked for. */
const TierDescription = ({ description }: { description: string }) => {
    const { language } = useUserContext();
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button
                size="small"
                onClick={(event) => {
                    event.preventDefault(); // keep the click from toggling the radio
                    setOpen((prev) => !prev);
                }}
                endIcon={open ? <ExpandLess /> : <ExpandMore />}
                sx={{ alignSelf: "flex-start", px: 0, minWidth: 0 }}
            >
                {LanguageTranslations.details[language]}
            </Button>
            <Collapse in={open}>
                <RichTextField defaultValue={description} />
            </Collapse>
        </>
    );
};

/**
 * Lets a member pick which membership tier to renew into when the
 * organization offers more than one.
 */
const MembershipTierDialog = ({
    open,
    products,
    selectedProductId,
    currentProductId,
    isPending,
    onSelect,
    onConfirm,
    onCancel,
}: MembershipTierDialogProps) => {
    const { language } = useUserContext();

    return (
        <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs">
            <DialogTitle>{LanguageTranslations.chooseMembership[language]}</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    {LanguageTranslations.chooseMembershipHint[language]}
                </DialogContentText>
                <RadioGroup
                    value={selectedProductId}
                    onChange={(event) => onSelect(event.target.value)}
                >
                    {products.map((membership) => (
                        <FormControlLabel
                            key={membership.product_id}
                            value={membership.product_id}
                            control={<Radio />}
                            sx={{ alignItems: "flex-start", mb: 1 }}
                            label={
                                <Stack>
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        sx={{ alignItems: "center" }}
                                    >
                                        <Typography sx={{ fontWeight: 500 }}>
                                            {membership.product.name}
                                        </Typography>
                                        {membership.product_id === currentProductId && (
                                            <Chip
                                                size="small"
                                                label={
                                                    LanguageTranslations.currentMembership[language]
                                                }
                                            />
                                        )}
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        {formatPrice(membership.product.price)} SEK ·{" "}
                                        {LanguageTranslations.durationDays[language](
                                            membership.duration,
                                        )}
                                    </Typography>
                                    {membership.product.description && (
                                        <TierDescription
                                            description={membership.product.description}
                                        />
                                    )}
                                </Stack>
                            }
                        />
                    ))}
                </RadioGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} disabled={isPending}>
                    {GlobalLanguageTranslations.cancel[language]}
                </Button>
                <Button
                    variant="contained"
                    color="warning"
                    onClick={onConfirm}
                    disabled={isPending || !selectedProductId}
                >
                    {LanguageTranslations.confirm[language]}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MembershipTierDialog;
