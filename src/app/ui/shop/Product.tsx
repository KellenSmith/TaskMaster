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
} from "@mui/material";

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
    onAddToCart?: Function;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const defaultImage = "/images/product-placeholder.svg";

    const getStockChipLabel = () => {
        if (product.unlimitedStock) {
            return "In Stock";
        }
        if (!product.stock) return "Out of Stock";
        return `${product.stock} left`;
    };

    const getStockChipColor = () => {
        if (product.unlimitedStock) {
            return "success";
        }
        if (!product.stock) return "error";
        return `warning`;
    };

    return (
        <>
            <Card
                sx={{
                    maxWidth: 250,
                    width: "fit-content",
                    cursor: "pointer",
                    transition: "0.3s",
                    "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 3,
                    },
                }}
                onClick={() => setIsOpen(true)}
            >
                <CardMedia>
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
                            {`${product.price.toFixed(2)} SEK`}
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

            <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{product.name}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
                        <Box sx={{ position: "relative", width: 300, height: 300, flexShrink: 0 }}>
                            <Image
                                src={product.imageUrl || defaultImage}
                                alt={product.name}
                                fill
                                style={{ objectFit: "cover", borderRadius: 8 }}
                            />
                        </Box>
                        <Box>
                            <Typography variant="body1" paragraph>
                                {product.description}
                            </Typography>
                            <Typography variant="h5" color="primary" sx={{ mt: 2 }}>
                                {`${product.price.toFixed(2)} SEK`}
                            </Typography>
                            {product.stock !== null && (
                                <Box sx={{ mt: 2 }}>
                                    <Chip
                                        label={
                                            product.unlimitedStock || product.stock > 5
                                                ? "In Stock"
                                                : `${product.stock} left`
                                        }
                                        color={
                                            product.stock > 0 || product.unlimitedStock
                                                ? "success"
                                                : "warning"
                                        }
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsOpen(false)}>Close</Button>
                    <Button
                        onClick={() => onAddToCart(product)}
                        disabled={!product.unlimitedStock && product.stock === 0}
                    >
                        buy
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
