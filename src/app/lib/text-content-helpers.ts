import { Language } from "../../prisma/generated/enums";
import { Prisma } from "../../prisma/generated/client";

export const getDefaultTextContent = async (
    id: string,
): Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>> => ({
    id: id,
    category: null,
    title_info_page_id: null,
    content_info_page_id: null,
    translations: [
        {
            id: `${id}-en`,
            text_content_id: id,
            language: Language.english,
            text: '<p><span style="color: rgb(255, 255, 255);">placeholder</span></p>',
        },
        {
            id: `${id}-sv`,
            text_content_id: id,
            language: Language.swedish,
            text: '<p><span style="color: rgb(255, 255, 255);">platshållare</span></p>',
        },
    ],
});
