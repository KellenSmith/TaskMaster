import { Prisma } from "../../prisma/generated/client";
import EditableTextContent from "./EditableTextContent";
import ErrorBoundarySuspense from "./ErrorBoundarySuspense";

interface TextContentProps {
    textContentPromise: Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>>;
}

const TextContent = ({ textContentPromise }: TextContentProps) => {
    return (
        <ErrorBoundarySuspense>
            <EditableTextContent textContentPromise={textContentPromise} />
        </ErrorBoundarySuspense>
    );
};

export default TextContent;
