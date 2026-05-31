import { ReactNode } from "react";

interface PagesLayoutProps {
    children: ReactNode;
}

const PagesLayout = ({ children }: PagesLayoutProps) => {
    return children;
};

export default PagesLayout;
