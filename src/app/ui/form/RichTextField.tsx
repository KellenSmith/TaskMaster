import { FC, useRef } from "react";
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
    fieldId: string;
    editMode: boolean;
    value: string;
    changeFieldValue: Function;
}

const RichTextField: FC<RichTextFieldProps> = ({ fieldId, editMode, value, changeFieldValue }) => {
    const extensions = useExtensions();
    const rteRef = useRef<RichTextEditorRef>(null);

    return editMode ? (
        <RichTextEditor
            ref={rteRef}
            immediatelyRender={false}
            extensions={extensions}
            content={value || FieldLabels[fieldId]}
            onUpdate={({ editor }) => changeFieldValue(fieldId, editor.getHTML())}
            renderControls={() => <RichTextFieldControls />}
        >
            {() => <LinkBubbleMenu />}
        </RichTextEditor>
    ) : (
        <Card>
            <RichTextReadOnly immediatelyRender={false} content={value} extensions={extensions} />
        </Card>
    );
};

export default RichTextField;
