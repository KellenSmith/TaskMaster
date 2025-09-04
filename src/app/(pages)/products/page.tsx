import ProductsDashboard from "./ProductsDashboard";
import { unstable_cache } from "next/cache";
import { getAllNonTicketProducts } from "../../lib/product-actions";
import GlobalConstants from "../../GlobalConstants";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

const ProductsPage = () => {
    const productsPromise = unstable_cache(getAllNonTicketProducts, [], {
        tags: [GlobalConstants.PRODUCT],
    })();

    return (
        <ErrorBoundarySuspense>
            <ProductsDashboard productsPromise={productsPromise} />
        </ErrorBoundarySuspense>
    );
};

export default ProductsPage;
