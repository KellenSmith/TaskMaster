import { CircularProgress, Typography } from "@mui/material";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import ProductsDashboard from "./ProductsDashboard";
import { unstable_cache } from "next/cache";
import { getAllProducts } from "../../lib/product-actions";
import GlobalConstants from "../../GlobalConstants";

const ProductsPage = () => {
    const productsPromise = unstable_cache(getAllProducts, [], {
        tags: [GlobalConstants.PRODUCT],
    })();

    return (
        <ErrorBoundary fallback={<Typography color="primary">Failed to fetch products</Typography>}>
            <Suspense fallback={<CircularProgress />}>
                <ProductsDashboard productsPromise={productsPromise} />
            </Suspense>
        </ErrorBoundary>
    );
};

export default ProductsPage;
