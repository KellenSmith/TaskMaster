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
                    // ✅ SECURITY: Restrict file types at HTML level
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
                    style={{ display: "none" }}
                    onChange={(event) => {
                        const file = event.target.files && event.target.files[0];
                        if (file) {
                            // ✅ SECURITY: Client-side validation
                            const maxSize = 5 * 1024 * 1024; // 5MB
                            const allowedTypes = [
                                "image/jpeg",
                                "image/jpg",
                                "image/png",
                                "image/webp",
                                "application/pdf",
                            ];

                            if (file.size > maxSize) {
                                alert(
                                    `File size too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
                                );
                                event.target.value = ""; // Clear the input
                                setFilename(null);
                                return;
                            }

                            if (!allowedTypes.includes(file.type)) {
                                alert(
                                    `File type not allowed. Please select: ${allowedTypes.join(", ")}`,
                                );
                                event.target.value = ""; // Clear the input
                                setFilename(null);
                                return;
                            }

                            setFilename(file.name);
                        } else {
                            setFilename(null);
                        }
                    }}
                />
            </Button>
            {filename ? <Typography variant="body2">{filename}</Typography> : null}
        </Stack>
    );
};

export default FileUploadField;
