import { ReactNode } from "react";

export const dynamic = "force-dynamic";

interface PagesLayoutProps {
    children: ReactNode;
}

const PagesLayout = ({ children }: PagesLayoutProps) => {
    return children;
};

export default PagesLayout;
