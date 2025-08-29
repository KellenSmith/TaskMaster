import { FC, useRef, useState } from "react";
import {
    LinkBubbleMenu,
    RichTextEditor,
    RichTextReadOnly,
    type RichTextEditorRef,
} from "mui-tiptap";
import RichTextFieldControls from "./RichTextFieldControls";
import useExtensions from "./useRichTextFieldExtensions";
import { FieldLabels } from "./FieldCfg";
import { useUserContext } from "../../context/UserContext";

interface RichTextFieldProps {
    fieldId?: string;
    editMode?: boolean;
    defaultValue: string;
}

const RichTextField: FC<RichTextFieldProps> = ({ fieldId, editMode = false, defaultValue }) => {
    const { language } = useUserContext();
    const extensions = useExtensions();
    const rteRef = useRef<RichTextEditorRef>(null);

    // TODO: sanitize HTML content

    const [content, setContent] = useState(
        defaultValue || (FieldLabels[fieldId][language] as string) || "",
    );

    return (
        <>
            {/* Hidden input for form submission */}
            <input type="hidden" name={fieldId} value={content} />
            {editMode ? (
                // Ensure the editor expands to available width
                <div style={{ width: "100%", backgroundColor: "transparent" }}>
                    <RichTextEditor
                        ref={rteRef}
                        immediatelyRender={false}
                        extensions={extensions}
                        content={content}
                        onUpdate={({ editor }) => setContent(editor.getHTML())}
                        renderControls={() => <RichTextFieldControls />}
                    >
                        {() => <LinkBubbleMenu />}
                    </RichTextEditor>
                </div>
            ) : (
                // Readonly view inside a Card that also spans full width
                <div style={{ width: "100%", backgroundColor: "transparent" }}>
                    <RichTextReadOnly
                        immediatelyRender={false}
                        content={content}
                        extensions={extensions}
                    />
                </div>
            )}
        </>
    );
};

export default RichTextField;
