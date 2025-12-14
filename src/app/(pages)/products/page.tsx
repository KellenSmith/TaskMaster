import ProductsDashboard from "./ProductsDashboard";
import { getAllNonTicketProducts } from "../../lib/product-actions";
import GlobalConstants from "../../GlobalConstants";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

const ProductsPage = () => {
    const productsPromise = getAllNonTicketProducts();

    return (
        <ErrorBoundarySuspense>
            <ProductsDashboard productsPromise={productsPromise} />
        </ErrorBoundarySuspense>
    );
};

export default ProductsPage;
