"use client";

import { use } from "react";
import { updateTextContent } from "../lib/text-content-actions";
import { useUserContext } from "../context/UserContext";
import Form from "./form/Form";
import GlobalConstants from "../GlobalConstants";
import { UpdateTextContentSchema } from "../lib/zod-schemas";
import z from "zod";
import { Prisma } from "@prisma/client";

interface EditableTextContentProps {
    id: string;
    textContentPromise: Promise<Prisma.TextContentGetPayload<{ select: { content: true } }>>;
}

const EditableTextContent = ({ id, textContentPromise }: EditableTextContentProps) => {
    const { language, editMode: editWebsiteMode } = useUserContext();
    const textContent = use(textContentPromise);

    console.log(textContent);

    const handleUpdateTextContent = async (
        fieldValues: z.output<typeof UpdateTextContentSchema>,
    ) => {
        await updateTextContent(id, language, fieldValues.content);
        return "Updated successfully";
    };

    return (
        <Form
            name={GlobalConstants.TEXT_CONTENT}
            action={handleUpdateTextContent}
            validationSchema={UpdateTextContentSchema}
            defaultValues={textContent}
            editable={editWebsiteMode}
        />
    );
};

export default EditableTextContent;
