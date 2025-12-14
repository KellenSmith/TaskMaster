import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import ShopDashboard from "./ShopDashboard";
import { getAllNonTicketProducts } from "../../lib/product-actions";
import GlobalConstants from "../../GlobalConstants";

const ShopPage = () => {
    const productsPromise = getAllNonTicketProducts();
    return (
        <ErrorBoundarySuspense>
            <ShopDashboard productsPromise={productsPromise} />
        </ErrorBoundarySuspense>
    );
};

export default ShopPage;
