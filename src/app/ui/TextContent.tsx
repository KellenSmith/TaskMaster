import { getTextContent } from "../lib/text-content-actions";
import EditableTextContent from "./EditableTextContent";
import GlobalConstants from "../GlobalConstants";
import { unstable_cache } from "next/cache";
import ErrorBoundarySuspense from "./ErrorBoundarySuspense";

interface TextContentProps {
    id: string;
    language?: string;
}

const TextContent = async ({ id, language = GlobalConstants.ENGLISH }: TextContentProps) => {
    const textContentPromise = unstable_cache(getTextContent, [id, language], {
        tags: [GlobalConstants.TEXT_CONTENT],
    })(id, language);

    return (
        <ErrorBoundarySuspense errorMessage="Failed to fetch text content">
            <EditableTextContent id={id} textContentPromise={textContentPromise} />
        </ErrorBoundarySuspense>
    );
};

export default TextContent;
