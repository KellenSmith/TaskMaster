"use client";

import {
    Button,
    Card,
    CardContent,
    CardHeader,
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
    passwordFields,
    priceFields,
    multiLineTextFields,
    explanatoryTexts,
} from "./FieldCfg";
import { DateTimePicker } from "@mui/x-date-pickers";
import GlobalConstants from "../../GlobalConstants";
import { Cancel, Edit } from "@mui/icons-material";
import RichTextField from "./RichTextField";
import AutocompleteWrapper, { CustomOptionProps } from "./AutocompleteWrapper";
import { useNotificationContext } from "../../context/NotificationContext";
import z, { ZodType, ZodError } from "zod";
import { allowRedirectException, formatPrice } from "../utils";
import dayjs from "dayjs";

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
    buttonLabel = "save",
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

    console.log(customOptions);

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
                        `Error in field ${FieldLabels[errorField as string]}: ${errorMessage}`,
                    );
                } else setValidationError("Unknown validation error");
            }
            return null;
        }
    };

    const submitForm = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const parsedFieldValues = validateFormData(formData);
        if (parsedFieldValues) {
            startTransition(async () => {
                try {
                    const submitResult = await action(parsedFieldValues);
                    addNotification(submitResult, "success");
                    !(editable && !readOnly) && setEditMode(false);
                } catch (error) {
                    allowRedirectException(error);
                    addNotification(error.message, "error");
                }
            });
        }
    };

    const getDefaultValue = (fieldId: string) => {
        if (defaultValues && fieldId in defaultValues) {
            if (priceFields.includes(fieldId)) return formatPrice(defaultValues[fieldId]);
            if (datePickerFields.includes(fieldId)) return dayjs(defaultValues[fieldId]);
            return defaultValues[fieldId];
        }

        if (datePickerFields.includes(fieldId))
            return requiredFields.includes(fieldId) ? dayjs().hour(18).minute(0).second(0) : null;
        if (checkboxFields.includes(fieldId)) return false;
        return "";
    };

    const getFieldComp = (fieldId: string) => {
        if (fieldId in selectFieldOptions || customOptions[fieldId]) {
            return (
                <AutocompleteWrapper
                    key={fieldId}
                    fieldId={fieldId}
                    label={FieldLabels[fieldId]}
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
                    key={fieldId}
                    name={fieldId}
                    disabled={!editMode || customReadOnlyFields.includes(fieldId)}
                    label={FieldLabels[fieldId]}
                    defaultValue={getDefaultValue(fieldId)}
                    slotProps={{
                        textField: {
                            name: fieldId,
                            required: requiredFields.includes(fieldId),
                        },
                        actionBar: { actions: ["clear", "accept"] },
                    }}
                />
            );
        }
        if (checkboxFields.includes(fieldId))
            return (
                <FormControlLabel
                    key={fieldId}
                    required={requiredFields.includes(fieldId)}
                    control={
                        <Checkbox
                            name={fieldId}
                            disabled={!editMode || customReadOnlyFields.includes(fieldId)}
                            defaultChecked={getDefaultValue(fieldId) || false}
                        />
                    }
                    label={FieldLabels[fieldId]}
                />
            );
        if (richTextFields.includes(fieldId)) {
            return (
                <RichTextField
                    key={fieldId}
                    fieldId={fieldId}
                    editMode={editMode || customReadOnlyFields.includes(fieldId)}
                    defaultValue={defaultValues?.[fieldId] || ""}
                />
            );
        }
        return (
            <TextField
                disabled={!editMode || customReadOnlyFields.includes(fieldId)}
                key={fieldId}
                label={FieldLabels[fieldId]}
                name={fieldId}
                defaultValue={getDefaultValue(fieldId)}
                required={requiredFields.includes(fieldId)}
                {...(passwordFields.includes(fieldId) && {
                    type: GlobalConstants.PASSWORD,
                })}
                multiline={multiLineTextFields.includes(fieldId)}
            />
        );
    };

    const getInfoTextComp = (fieldId: string) => {
        const infoText = customInfoTexts[fieldId] || explanatoryTexts[fieldId];
        if (!infoText) return null;
        return (
            <>
                <Card sx={{ py: 1 }}>
                    {infoText.split("\n").map((line, index) => (
                        <Typography key={index} variant="subtitle2" color="primary">
                            {line}
                        </Typography>
                    ))}
                </Card>
                <Divider />
            </>
        );
    };

    return (
        <Card component="form" onSubmit={submitForm} sx={{ overflowY: "auto" }}>
            {(editable || FieldLabels[name]) && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <CardHeader title={FieldLabels[name]} />
                    {editable && (
                        <IconButton sx={{ marginRight: 2 }} onClick={() => setEditMode(!editMode)}>
                            {editMode ? <Cancel /> : <Edit />}
                        </IconButton>
                    )}
                </Stack>
            )}

            <CardContent sx={{ display: "flex", flexDirection: "column", rowGap: 2 }}>
                <Stack spacing={2}>
                    {renderedFields.map((fieldId) => (
                        <Stack key={fieldId}>
                            {getFieldComp(fieldId)}
                            {getInfoTextComp(fieldId)}
                        </Stack>
                    ))}
                    {validationError && <Typography color="error">{validationError}</Typography>}
                </Stack>
                {editMode && (
                    <Button type="submit" variant="contained" disabled={isPending}>
                        {buttonLabel}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default Form;
