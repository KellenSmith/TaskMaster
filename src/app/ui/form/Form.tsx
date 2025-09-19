"use client";

import {
    Button,
    Card,
    CardContent,
    Checkbox,
    Divider,
    FormControlLabel,
    IconButton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { useState, FC, useTransition, FormEvent, useMemo } from "react";
import {
    FieldLabels,
    RenderedFields,
    selectFieldOptions,
    RequiredFields,
    datePickerFields,
    richTextFields,
    checkboxFields,
    priceFields,
    multiLineTextFields,
    explanatoryTexts,
    fileUploadFields,
} from "./FieldCfg";
import { DateTimePicker } from "@mui/x-date-pickers";
import { Cancel, Edit } from "@mui/icons-material";
import FileUploadField from "./FileUploadField";
import RichTextField from "./RichTextField";
import AutocompleteWrapper, { CustomOptionProps } from "./AutocompleteWrapper";
import { useNotificationContext } from "../../context/NotificationContext";
import z, { ZodType, ZodError } from "zod";
import { allowRedirectException, formatPrice } from "../utils";
import dayjs from "dayjs";
import { useUserContext } from "../../context/UserContext";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import LanguageTranslations from "../LanguageTranslations";
import { upload } from "@vercel/blob/client";

interface FormProps {
    name: string;
    buttonLabel?: string;
    action?: (fieldValues: any) => Promise<string>; // eslint-disable-line no-unused-vars
    validationSchema?: ZodType<any>;
    defaultValues?: any;
    customOptions?: { [key: string]: CustomOptionProps[] }; // Additional options for Autocomplete field , if needed
    customReadOnlyFields?: string[]; // Fields that should be read-only even if editMode is true
    customIncludedFields?: string[]; // Include extra fields which are not preconfigured in FieldCfg.ts
    customRequiredFields?: string[]; // Include extra fields which are required but not preconfigured in FieldCfg.ts
    customInfoTexts?: { [key: string]: string }; // Include extra information texts for specific fields
    readOnly?: boolean;
    editable?: boolean;
}

const Form: FC<FormProps> = ({
    name,
    buttonLabel,
    action,
    validationSchema,
    defaultValues,
    customOptions = {},
    customReadOnlyFields = [],
    customIncludedFields = [],
    customRequiredFields = [],
    customInfoTexts = {},
    readOnly = true,
    editable = true,
}) => {
    const { language } = useUserContext();
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [editMode, setEditMode] = useState(!readOnly);
    const { addNotification } = useNotificationContext();
    const renderedFields = useMemo(
        () => [...(RenderedFields?.[name] || []), ...(customIncludedFields || [])],
        [name, customIncludedFields],
    );
    const requiredFields = useMemo(
        () => [
            ...(name in RequiredFields ? RequiredFields[name] : []),
            ...(customRequiredFields || []),
        ],
        [name, customRequiredFields],
    );

    const uploadFileAndGetUrl = async (file: File): Promise<string> => {
        // ✅ SECURITY: Client-side file validation
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "application/pdf",
        ];

        // Validate file size
        if (file.size > maxSize) {
            throw new Error(
                `File size too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
            );
        }

        // Validate file type
        if (!allowedTypes.includes(file.type)) {
            throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(", ")}`);
        }

        // Validate file extension
        const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
        const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
        if (!extension || !allowedExtensions.includes(extension)) {
            throw new Error(
                `File extension not allowed. Allowed extensions: ${allowedExtensions.join(", ")}`,
            );
        }

        // Sanitize filename
        const sanitizedName = file.name
            .replace(/[/\\]/g, "")
            // eslint-disable-next-line no-control-regex
            .replace(/[\x00-\x1f\x80-\x9f]/g, "")
            .replace(/[<>:"|?*]/g, "")
            .substring(0, 100);

        const newBlob = await upload(`${name}/${sanitizedName}`, file, {
            access: "public",
            handleUploadUrl: "/api/file-upload",
            clientPayload: JSON.stringify({
                type: file.type,
                name: file.name,
                size: file.size,
            }),
        });
        return newBlob.url;
    };

    const uploadFiles = async (formData: FormData): Promise<FormData | null> => {
        try {
            // Use a copy of the keys to avoid iterator issues when modifying FormData
            for (let fieldId of [...formData.keys()]) {
                if (!fileUploadFields.includes(fieldId)) continue;
                const file = formData.get(fieldId) as File;
                if (!file?.name || file.size === 0) {
                    // Remove empty file entries to avoid overwriting existing data with empty values
                    formData.delete(fieldId);
                    continue;
                }
                const newBlobUrl = await uploadFileAndGetUrl(file);
                formData.set(fieldId, newBlobUrl);
            }
            return formData;
        } catch (error) {
            addNotification("File upload failed: " + error.message, "error");
        }
    };

    const validateFormData = (formData: FormData): z.infer<typeof validationSchema> | null => {
        const formDataObject = Object.fromEntries(formData);
        if (!validationSchema) return formDataObject;
        try {
            const parsedFieldValues = validationSchema.parse(formDataObject);
            setValidationError(null);
            return parsedFieldValues;
        } catch (error) {
            if (error instanceof ZodError) {
                const zodIssues = error.issues;
                if (zodIssues.length > 0) {
                    const errorField = zodIssues[0]?.path[0];
                    const errorMessage = error.issues[0]?.message;
                    setValidationError(
                        `${LanguageTranslations.errorInField[language]} ${FieldLabels[errorField as string][language]}: ${errorMessage}`,
                    );
                } else setValidationError("Unknown validation error");
            }
            return null;
        }
    };

    const submitForm = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Ensure action is available before proceeding
        if (!action || typeof action !== "function") {
            addNotification("Form action is not available. Please try again.", "error");
            return;
        }

        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const formDataWithFileUrls = await uploadFiles(formData);
            if (!formDataWithFileUrls) return;
            const parsedFieldValues = validateFormData(formDataWithFileUrls);
            if (!parsedFieldValues) return;
            try {
                const submitResult = await action(formDataWithFileUrls);
                addNotification(submitResult, "success");
                !(editable && !readOnly) && setEditMode(false);
            } catch (error) {
                allowRedirectException(error);
                addNotification(error.message, "error");
            }
        });
    };

    // Make the Form rerender fields when default values change
    const getFieldCompKey = (fieldId: string): string => `${fieldId}-${defaultValues?.[fieldId]}`;

    const getDefaultValue = (fieldId: string) => {
        if (defaultValues && fieldId in defaultValues) {
            if (priceFields.includes(fieldId)) return formatPrice(defaultValues[fieldId]);
            if (datePickerFields.includes(fieldId)) return dayjs.utc(defaultValues[fieldId]);
            return defaultValues[fieldId];
        }

        if (datePickerFields.includes(fieldId))
            return requiredFields.includes(fieldId)
                ? dayjs.utc().hour(18).minute(0).second(0)
                : null;
        if (checkboxFields.includes(fieldId)) return false;
        return null;
    };

    const getFieldComp = (fieldId: string) => {
        if (fieldId in selectFieldOptions || customOptions[fieldId]) {
            return (
                <AutocompleteWrapper
                    key={getFieldCompKey(fieldId)}
                    fieldId={fieldId}
                    label={FieldLabels[fieldId][language] as string}
                    editMode={editMode}
                    defaultValue={defaultValues?.[fieldId]}
                    customReadOnlyFields={customReadOnlyFields}
                    customOptions={customOptions[fieldId]}
                    required={requiredFields.includes(fieldId)}
                />
            );
        }
        if (datePickerFields.includes(fieldId)) {
            return (
                <DateTimePicker
                    key={getFieldCompKey(fieldId)}
                    name={fieldId}
                    disabled={!editMode || customReadOnlyFields.includes(fieldId)}
                    label={FieldLabels[fieldId][language] as string}
                    defaultValue={getDefaultValue(fieldId)}
                    slotProps={{
                        textField: {
                            name: fieldId,
                            required: requiredFields.includes(fieldId),
                        },
                        // TODO: Implement translation for action buttons
                        actionBar: { actions: ["clear", "accept"] },
                    }}
                />
            );
        }
        if (checkboxFields.includes(fieldId))
            return (
                <FormControlLabel
                    key={getFieldCompKey(fieldId)}
                    required={requiredFields.includes(fieldId)}
                    control={
                        <Checkbox
                            name={fieldId}
                            disabled={!editMode || customReadOnlyFields.includes(fieldId)}
                            defaultChecked={getDefaultValue(fieldId) || false}
                        />
                    }
                    label={FieldLabels[fieldId][language] as string}
                />
            );
        if (richTextFields.includes(fieldId)) {
            return (
                <RichTextField
                    key={getFieldCompKey(fieldId)}
                    fieldId={fieldId}
                    editMode={editMode || customReadOnlyFields.includes(fieldId)}
                    defaultValue={defaultValues?.[fieldId] || ""}
                />
            );
        }
        if (fileUploadFields.includes(fieldId)) {
            // FileUploadField renders the file button + filename. It includes the input named by fieldId
            return (
                <FileUploadField
                    key={getFieldCompKey(fieldId)}
                    fieldId={fieldId}
                    editMode={editMode}
                    customReadOnlyFields={customReadOnlyFields}
                />
            );
        }
        return (
            <TextField
                disabled={!editMode || customReadOnlyFields.includes(fieldId)}
                key={getFieldCompKey(fieldId)}
                label={FieldLabels[fieldId][language] as string}
                name={fieldId}
                defaultValue={getDefaultValue(fieldId)}
                required={requiredFields.includes(fieldId)}
                multiline={multiLineTextFields.includes(fieldId)}
            />
        );
    };

    const getInfoTextComp = (fieldId: string) => {
        const infoText = customInfoTexts[fieldId] || explanatoryTexts[fieldId]?.[language];
        if (!infoText) return null;
        return (
            <Stack key={getFieldCompKey(fieldId) + "-infotext"}>
                <Divider />
                <Card sx={{ py: 1 }}>
                    {infoText.split("\n").map((line, index) => (
                        <Typography key={index} variant="subtitle2" color="primary">
                            {line}
                        </Typography>
                    ))}
                </Card>
            </Stack>
        );
    };

    return (
        <Card component="form" onSubmit={submitForm} sx={{ overflowY: "auto", width: "100%" }}>
            {editable && (
                <Stack direction="row" justifyContent="flex-end" alignItems="center">
                    {editable && (
                        <IconButton sx={{ marginRight: 2 }} onClick={() => setEditMode(!editMode)}>
                            {editMode && editable ? <Cancel /> : <Edit />}
                        </IconButton>
                    )}
                </Stack>
            )}

            <CardContent sx={{ display: "flex", flexDirection: "column", rowGap: 2 }}>
                <Stack spacing={2}>
                    {renderedFields.map((fieldId) => (
                        <Stack key={fieldId}>
                            {getInfoTextComp(fieldId)}
                            {getFieldComp(fieldId)}
                        </Stack>
                    ))}
                    {validationError && <Typography color="error">{validationError}</Typography>}
                </Stack>
                {editMode && (
                    <Button type="submit" variant="contained" disabled={isPending}>
                        {buttonLabel || GlobalLanguageTranslations.save[language]}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default Form;
