"use client";

import { useState } from "react";
import Image from "next/image";
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Chip,
    Tooltip,
    Stack,
} from "@mui/material";
import { Lock } from "@mui/icons-material";
import { formatPrice } from "../utils";
import RichTextField from "../form/RichTextField";

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock?: number | null;
    unlimitedStock: boolean;
    imageUrl: string;
}

interface ProductCardProps {
    product: Product;
    onAddToCart?: (productId: string) => void; // eslint-disable-line no-unused-vars
    isAvailable?: boolean;
    makeAvailableText?: string;
    onClick?: () => void;
}

export default function ProductCard({
    product,
    onAddToCart,
    isAvailable = true,
    makeAvailableText,
    onClick,
}: ProductCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const defaultImage = "/images/product-placeholder.svg";

    const getStockChipLabel = () => {
        if (product.unlimitedStock || product.stock > 5) {
            return "In Stock";
        }
        if (!product.stock) return "Out of Stock";
        return `${product.stock} left`;
    };

    const getStockChipColor = () => {
        if (product.unlimitedStock || product.stock > 5) {
            return "success";
        }
        if (!product.stock) return "error";
        return `warning`;
    };

    return (
        <>
            <Tooltip
                title={!isAvailable && makeAvailableText ? makeAvailableText : ""}
                arrow
                placement="top"
                disableHoverListener={isAvailable}
            >
                <Card
                    sx={{
                        maxWidth: 250,
                        width: "fit-content",
                        cursor: "pointer",
                        transition: "0.3s",
                        opacity: isAvailable ? 1 : 0.6,
                        filter: isAvailable ? "none" : "grayscale(30%)",
                        "&:hover": {
                            transform: isAvailable ? "translateY(-4px)" : "none",
                            boxShadow: isAvailable ? 3 : 1,
                        },
                    }}
                    onClick={onClick || (() => setIsOpen(true))}
                >
                    <CardMedia sx={{ position: "relative" }}>
                        <Image
                            src={product.imageUrl || defaultImage}
                            alt={product.name}
                            width={400}
                            height={400}
                            style={{
                                objectFit: "contain",
                                maxHeight: 250,
                                maxWidth: 250,
                            }}
                        />
                        {!isAvailable && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                                    borderRadius: "4px 4px 0 0",
                                }}
                            >
                                <Lock
                                    sx={{
                                        color: "white",
                                        fontSize: 48,
                                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                                    }}
                                />
                            </Box>
                        )}
                    </CardMedia>
                    <CardContent>
                        <Typography gutterBottom variant="h6" component="h2">
                            {product.name}
                        </Typography>
                        <Box
                            sx={{
                                mt: 2,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Typography variant="h6" color="primary">
                                {`${formatPrice(product.price)} SEK`}
                            </Typography>
                            {product.stock !== null && (
                                <Chip
                                    label={getStockChipLabel()}
                                    color={getStockChipColor()}
                                    size="small"
                                />
                            )}
                        </Box>
                    </CardContent>
                </Card>
            </Tooltip>

            <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{product.name}</DialogTitle>
                <DialogContent>
                    <Stack direction="row" spacing={4}>
                        <Stack
                            sx={{ position: "relative", width: 300, height: 300, flexShrink: 0 }}
                        >
                            <Image
                                src={product.imageUrl || defaultImage}
                                alt={product.name}
                                fill
                                style={{ objectFit: "cover", borderRadius: 8 }}
                            />
                            {!isAvailable && (
                                <Stack
                                    sx={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                                        borderRadius: 2,
                                    }}
                                >
                                    <Lock
                                        sx={{
                                            color: "white",
                                            fontSize: 64,
                                            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                                        }}
                                    />
                                </Stack>
                            )}
                        </Stack>
                        <Stack width="100%" spacing={2}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="h5" color="primary" sx={{ mt: 2 }}>
                                    {`${formatPrice(product.price)} SEK`}
                                </Typography>
                                {product.stock !== null && (
                                    <Box sx={{ mt: 2 }}>
                                        <Chip
                                            label={getStockChipLabel()}
                                            color={getStockChipColor()}
                                        />
                                    </Box>
                                )}
                            </Stack>
                            <RichTextField defaultValue={product.description} />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsOpen(false)}>Close</Button>
                    <Button
                        onClick={() => onAddToCart(product.id)}
                        disabled={!isAvailable || (!product.unlimitedStock && product.stock === 0)}
                    >
                        buy
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
