"use client";
import { use, useMemo, useState } from "react";
import {
    Stack,
    Typography,
    useTheme,
    Tab,
    Tabs,
    useMediaQuery,
    Button,
    Dialog,
} from "@mui/material";
import { Prisma } from "@prisma/client";
import { useUserContext } from "../../context/UserContext";
import { createAndRedirectToOrder } from "../../lib/order-actions";
import {
    createMembershipProduct,
    deleteProduct,
    updateMembershipProduct,
    updateProduct,
    createProduct,
} from "../../lib/product-actions";
import { isUserAdmin } from "../../lib/utils";
import ProductCard from "../../ui/shop/ProductCard";
import Form from "../../ui/form/Form";
import { allowRedirectException } from "../../ui/utils";
import { useNotificationContext } from "../../context/NotificationContext";
import { useRouter, useSearchParams } from "next/navigation";
import { clientRedirect } from "../../lib/utils";
import GlobalConstants from "../../GlobalConstants";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import ConfirmButton from "../../ui/ConfirmButton";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import LocalMallIcon from "@mui/icons-material/LocalMall";
import {
    MembershipCreateSchema,
    MembershipUpdateSchema,
    ProductCreateSchema,
    ProductUpdateSchema,
} from "../../lib/zod-schemas";

interface ShopDashboardProps {
    productsPromise: Promise<Prisma.ProductGetPayload<{ include: { membership: true } }>[]>;
}

const implementedTabs = {
    memberships: "memberships",
    merch: "merch",
};

const tabLabels = {
    [implementedTabs.memberships]: "Memberships",
    [implementedTabs.merch]: "Merch",
};

const ShopDashboard = ({ productsPromise }: ShopDashboardProps) => {
    const { user, language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
    const products = use(productsPromise);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);

    // Filter products into memberships and merch
    const membershipProducts = useMemo(
        () => products.filter((product) => product.membership !== null),
        [products],
    );

    const merchProducts = useMemo(
        () => products.filter((product) => product.membership === null),
        [products],
    );

    const tabs = useMemo(() => {
        const availableTabs: Record<string, string | null> = {
            memberships: implementedTabs.memberships,
            merch: implementedTabs.merch,
        };
        return availableTabs;
    }, []);

    const openTab = useMemo(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam && Object.values(tabs).includes(tabParam)) {
            return tabParam;
        }
        // Default to memberships tab
        return implementedTabs.memberships;
    }, [searchParams, tabs]);

    const setOpenTab = (tab: string) => clientRedirect(router, [GlobalConstants.SHOP], { tab });

    const createProductOrder = async (productId: string) => {
        const productOrderItems: Prisma.OrderItemCreateManyOrderInput = {
            product_id: productId,
            quantity: 1,
        };
        try {
            await createAndRedirectToOrder(user.id, [productOrderItems]);
        } catch (error) {
            allowRedirectException(error);
            addNotification("Failed to create order", "error");
        }
    };

    const createProductAction = async (formData: FormData) => {
        if (openTab === implementedTabs.memberships) {
            await createMembershipProduct(formData);
        } else {
            await createProduct(formData);
        }
        setDialogOpen(false);
        return GlobalLanguageTranslations.successfulSave[language];
    };

    const updateProductAction = async (formData: FormData) => {
        if (openTab === implementedTabs.memberships) {
            await updateMembershipProduct(editingProductId!, formData);
        } else {
            await updateProduct(editingProductId!, formData);
        }
        setDialogOpen(false);
        setEditingProductId(null);
        return GlobalLanguageTranslations.successfulSave[language];
    };

    const deleteProductAction = async (productId: string) => {
        try {
            await deleteProduct(productId);
            addNotification(GlobalLanguageTranslations.successfulDelete[language], "success");
        } catch {
            addNotification(GlobalLanguageTranslations.failedDelete[language], "error");
        }
    };

    const handleEditProduct = (productId: string) => {
        setEditingProductId(productId);
        setDialogOpen(true);
    };

    const getFormDefaultValues = () => {
        if (!editingProductId) return null;
        const product = products.find((p) => p.id === editingProductId);
        if (!product) return null;
        return { ...product, ...(product.membership && { duration: product.membership.duration }) };
    };

    const renderProducts = (productsToRender: typeof products) => {
        if (productsToRender.length === 0) {
            return <Typography color="primary">No products available</Typography>;
        }

        return (
            <Stack direction="row" flexWrap="wrap" gap={2}>
                {productsToRender.map((product) => (
                    <Stack key={product.id}>
                        <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={createProductOrder}
                        />
                        {isUserAdmin(user) && (
                            <Stack>
                                <Button onClick={() => handleEditProduct(product.id)}>
                                    {GlobalLanguageTranslations.edit[language]}
                                </Button>
                                <ConfirmButton
                                    color="error"
                                    onClick={() => deleteProductAction(product.id)}
                                >
                                    {GlobalLanguageTranslations.delete[language]}
                                </ConfirmButton>
                            </Stack>
                        )}
                    </Stack>
                ))}
            </Stack>
        );
    };

    const getTabContent = () => {
        switch (openTab) {
            case implementedTabs.memberships:
                return renderProducts(membershipProducts);
            case implementedTabs.merch:
                return renderProducts(merchProducts);
            default:
                return renderProducts(
                    membershipProducts.length > 0 ? membershipProducts : merchProducts,
                );
        }
    };

    // If no products at all, show empty state
    if (products.length === 0) {
        return (
            <Stack spacing={2} sx={{ padding: 2 }}>
                <Typography variant="h6" color={theme.palette.primary.main}>
                    Shop
                </Typography>
                <Typography color="primary">No products available</Typography>
            </Stack>
        );
    }

    const getValidationSchema = () => {
        if (openTab === implementedTabs.memberships) {
            if (editingProductId) return MembershipUpdateSchema;
            return MembershipCreateSchema;
        }
        if (editingProductId) return ProductUpdateSchema;
        return ProductCreateSchema;
    };

    return (
        <Stack>
            <Tabs
                value={openTab}
                onChange={(_, newTab) => setOpenTab(newTab)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                aria-label="shop tabs"
            >
                {Object.keys(tabs).map((tabKey) => {
                    const tabVal = tabs[tabKey];
                    if (!tabVal) return null;
                    const label = tabLabels[tabVal];
                    const icon =
                        tabVal === implementedTabs.memberships ? (
                            <CardMembershipIcon fontSize={isSmall ? "small" : "medium"} />
                        ) : tabVal === implementedTabs.merch ? (
                            <LocalMallIcon fontSize={isSmall ? "small" : "medium"} />
                        ) : undefined;

                    return (
                        <Tab
                            key={tabKey}
                            value={tabVal}
                            label={isSmall ? undefined : label}
                            icon={icon}
                            iconPosition="start"
                            wrapped
                            sx={{
                                minWidth: isSmall ? 64 : 120,
                                px: isSmall ? 0.5 : 1,
                                fontSize: isSmall ? "0.75rem" : "0.875rem",
                                textTransform: "none",
                            }}
                        />
                    );
                })}
            </Tabs>
            <ErrorBoundarySuspense>
                <Stack spacing={2} sx={{ padding: 2 }}>
                    {isUserAdmin(user) && (
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" color={theme.palette.primary.main}>
                                {tabLabels[openTab]}
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => setDialogOpen(true)}
                                size="small"
                            >
                                Add{" "}
                                {openTab === implementedTabs.memberships ? "Membership" : "Product"}
                            </Button>
                        </Stack>
                    )}
                    {getTabContent()}
                </Stack>
            </ErrorBoundarySuspense>

            <Dialog
                fullScreen={isSmall}
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setEditingProductId(null);
                }}
                maxWidth="xl"
                fullWidth
            >
                <Form
                    name={
                        openTab === implementedTabs.memberships
                            ? GlobalConstants.MEMBERSHIP
                            : GlobalConstants.PRODUCT
                    }
                    action={editingProductId ? updateProductAction : createProductAction}
                    validationSchema={getValidationSchema()}
                    defaultValues={getFormDefaultValues()}
                    readOnly={false}
                    editable={false}
                />
                <Button
                    onClick={() => {
                        setDialogOpen(false);
                        setEditingProductId(null);
                    }}
                >
                    {GlobalLanguageTranslations.cancel[language]}
                </Button>
            </Dialog>
        </Stack>
    );
};

export default ShopDashboard;
