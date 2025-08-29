import EditableTextContent from "./EditableTextContent";
import ErrorBoundarySuspense from "./ErrorBoundarySuspense";
import { Prisma } from "@prisma/client";

interface TextContentProps {
    id: string;
    textContentPromise: Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>>;
}

const TextContent = ({ id, textContentPromise }: TextContentProps) => {
    return (
        <ErrorBoundarySuspense>
            <EditableTextContent id={id} textContentPromise={textContentPromise} />
        </ErrorBoundarySuspense>
    );
};

export default TextContent;
