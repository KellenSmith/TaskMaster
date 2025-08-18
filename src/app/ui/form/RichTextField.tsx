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
import { Card } from "@mui/material";

interface RichTextFieldProps {
    fieldId?: string;
    editMode: boolean;
    defaultValue: string;
}

const RichTextField: FC<RichTextFieldProps> = ({ fieldId, editMode, defaultValue }) => {
    const extensions = useExtensions();
    const rteRef = useRef<RichTextEditorRef>(null);

    const [content, setContent] = useState(defaultValue || FieldLabels[fieldId] || "");

    return (
        <>
            {/* Hidden input for form submission */}
            <input type="hidden" name={fieldId} value={content} />
            {editMode ? (
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
            ) : (
                <Card>
                    <RichTextReadOnly
                        immediatelyRender={false}
                        content={content}
                        extensions={extensions}
                    />
                </Card>
            )}
        </>
    );
};

export default RichTextField;
