import { unstable_cache } from "next/cache";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import ShopDashboard from "./ShopDashboard";
import { getAllNonTicketProducts } from "../../lib/product-actions";
import GlobalConstants from "../../GlobalConstants";

const ShopPage = () => {
    const productsPromise = unstable_cache(getAllNonTicketProducts, [], {
        tags: [GlobalConstants.PRODUCT],
    })();
    return (
        <ErrorBoundarySuspense>
            <ShopDashboard productsPromise={productsPromise} />
        </ErrorBoundarySuspense>
    );
};

export default ShopPage;
