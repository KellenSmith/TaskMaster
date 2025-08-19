import { getTextContent } from "../lib/text-content-actions";
import { CircularProgress, Typography } from "@mui/material";
import EditableTextContent from "./EditableTextContent";
import GlobalConstants from "../GlobalConstants";
import { unstable_cache } from "next/cache";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

interface TextContentProps {
    id: string;
    language?: string;
}

const TextContent = async ({ id, language = GlobalConstants.ENGLISH }: TextContentProps) => {
    const textContentPromise = unstable_cache(getTextContent, [id, language], {
        tags: [GlobalConstants.TEXT_CONTENT],
    })(id, language);

    return (
        <ErrorBoundary
            fallback={<Typography color="error">Failed loading text content</Typography>}
        >
            <Suspense fallback={<CircularProgress />}>
                <EditableTextContent id={id} textContentPromise={textContentPromise} />
            </Suspense>
        </ErrorBoundary>
    );
};

export default TextContent;
