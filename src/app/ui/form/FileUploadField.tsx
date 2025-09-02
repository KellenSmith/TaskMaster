"use client";

import { FC, useState } from "react";
import { Button, Stack, Typography } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import { FieldLabels } from "./FieldCfg";
import { useUserContext } from "../../context/UserContext";

interface Props {
    fieldId: string;
    editMode: boolean;
    customReadOnlyFields: string[];
}

const FileUploadField: FC<Props> = ({ fieldId, editMode, customReadOnlyFields }) => {
    const { language } = useUserContext();
    const [filename, setFilename] = useState<string | null>(null);

    return (
        <Stack direction="row" spacing={2} alignItems="center">
            <Button
                fullWidth
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                startIcon={<CloudUpload />}
                disabled={!editMode || customReadOnlyFields.includes(fieldId)}
            >
                {FieldLabels[fieldId][language] as string}
                <input
                    type="file"
                    name={fieldId}
                    style={{ display: "none" }}
                    onChange={(event) => {
                        const file = event.target.files && event.target.files[0];
                        if (file) setFilename(file.name);
                        else setFilename(null);
                    }}
                />
            </Button>
            {filename ? <Typography variant="body2">{filename}</Typography> : null}
        </Stack>
    );
};

export default FileUploadField;
