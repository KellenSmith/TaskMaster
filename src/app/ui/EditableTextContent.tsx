"use client";

import { use, useMemo } from "react";
import { updateTextContent } from "../lib/text-content-actions";
import { useUserContext } from "../context/UserContext";
import Form from "./form/Form";
import GlobalConstants from "../GlobalConstants";
import { UpdateTextContentSchema } from "../lib/zod-schemas";
import z from "zod";
import { Prisma } from "@prisma/client";

interface EditableTextContentProps {
    id: string;
    textContentPromise: Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>>;
}

const EditableTextContent = ({ id, textContentPromise }: EditableTextContentProps) => {
    const { language, editMode: editWebsiteMode } = useUserContext();
    const textContent = use(textContentPromise);
    const textTranslation = useMemo(
        () => textContent.translations.find((t) => t.language === language),
        [language, textContent],
    );

    const handleUpdateTextContent = async (formData: FormData) => {
        await updateTextContent(id, language, formData.get(GlobalConstants.TEXT) as string);
        return "Updated successfully";
    };

    return (
        <Form
            name={GlobalConstants.TEXT_CONTENT}
            action={handleUpdateTextContent}
            validationSchema={UpdateTextContentSchema}
            defaultValues={textTranslation}
            editable={editWebsiteMode}
        />
    );
};

export default EditableTextContent;
