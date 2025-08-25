import ProductsDashboard from "./ProductsDashboard";
import { unstable_cache } from "next/cache";
import { getAllProducts } from "../../lib/product-actions";
import GlobalConstants from "../../GlobalConstants";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

const ProductsPage = () => {
    const productsPromise = unstable_cache(getAllProducts, [], {
        tags: [GlobalConstants.PRODUCT],
    })();

    return (
        <ErrorBoundarySuspense errorMessage="Failed to load products">
            <ProductsDashboard productsPromise={productsPromise} />
        </ErrorBoundarySuspense>
    );
};

export default ProductsPage;
