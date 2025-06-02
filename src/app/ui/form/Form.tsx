"use client";

import {
    Autocomplete,
    Button,
    Card,
    CardContent,
    CardHeader,
    Checkbox,
    FormControlLabel,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { useState, FC, ChangeEvent, ReactElement, useEffect } from "react";
import {
    FieldLabels,
    RenderedFields,
    selectFieldOptions,
    RequiredFields,
    datePickerFields,
    richTextFields,
    allowSelectMultiple,
    checkboxFields,
    passwordFields,
} from "./FieldCfg";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import GlobalConstants from "../../GlobalConstants";
import { Cancel, Edit } from "@mui/icons-material";
import RichTextField from "./RichTextField";

export interface FormActionState {
    status: number;
    errorMsg: string;
    result: string;
}

export const defaultActionState: FormActionState = {
    status: 200,
    errorMsg: "",
    result: "",
};

export const getFormActionMsg = (formActionState: FormActionState): ReactElement | null =>
    (formActionState.errorMsg || formActionState.result) && (
        <Card sx={{ padding: 2 }}>
            {formActionState.errorMsg && (
                <Typography color="error" textAlign="center">
                    {formActionState.errorMsg}
                </Typography>
            )}
            {formActionState.result && (
                <Typography color="success" textAlign="center">
                    {formActionState.result}
                </Typography>
            )}
        </Card>
    );

interface FormProps {
    name: string;
    buttonLabel?: string;
    action?: (currentActionState: FormActionState, fieldValues: any) => Promise<FormActionState>; // eslint-disable-line no-unused-vars
    defaultValues?: any;
    customOptions?: Object; // Additional options for Autocomplete field , if needed
    readOnly?: boolean;
    editable?: boolean;
}

const getFieldValues = (formName: string, defaultValues: any) => {
    const fieldValues = {};
    for (let fieldId of RenderedFields[formName]) {
        if (defaultValues && fieldId in defaultValues)
            fieldValues[fieldId] = defaultValues[fieldId];
        else {
            if (fieldId in selectFieldOptions) {
                if (RequiredFields[formName].includes(fieldId)) {
                    const defaultOption = selectFieldOptions[fieldId][0];
                    fieldValues[fieldId] = allowSelectMultiple.includes(fieldId)
                        ? [defaultOption]
                        : defaultOption;
                } else fieldValues[fieldId] = allowSelectMultiple.includes(fieldId) ? [] : "";
            } else if (checkboxFields.includes(fieldId)) {
                fieldValues[fieldId] = false;
            } else if (datePickerFields.includes(fieldId)) {
                fieldValues[fieldId] = null;
            } else fieldValues[fieldId] = "";
        }
    }
    return fieldValues;
};

const Form: FC<FormProps> = ({
    name,
    buttonLabel,
    action,
    defaultValues,
    customOptions = {},
    readOnly = true,
    editable = true,
}) => {
    const [fieldValues, setFieldValues] = useState<{ [key: string]: string | string[] | boolean }>(
        getFieldValues(name, defaultValues),
    );
    const [loading, setLoading] = useState(false);
    const [actionState, setActionState] = useState(defaultActionState);
    const [editMode, setEditMode] = useState(!readOnly);

    useEffect(() => {
        setEditMode(!readOnly);
    }, [readOnly]);

    const changeFieldValue = (fieldId: string, value: string | string[] | boolean) => {
        setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    };

    const submitForm = async (event) => {
        event.preventDefault();
        setLoading(true);
        const newActionState = await action(actionState, fieldValues);
        setActionState(newActionState);
        setLoading(false);
        editable && newActionState.status === 200 && setEditMode(false);
    };

    const getFieldComp = (fieldId: string) => {
        if (fieldId in selectFieldOptions) {
            return (
                <Autocomplete
                    disabled={!editMode}
                    key={fieldId}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={FieldLabels[fieldId]}
                            required={
                                name in RequiredFields && RequiredFields[name].includes(fieldId)
                            }
                        />
                    )}
                    autoSelect={name in RequiredFields && RequiredFields[name].includes(fieldId)}
                    options={customOptions[fieldId] || selectFieldOptions[fieldId]}
                    value={fieldValues[fieldId]}
                    onChange={(_, newValue) =>
                        changeFieldValue(fieldId, newValue as string | string[])
                    }
                    multiple={allowSelectMultiple.includes(fieldId)}
                />
            );
        }
        if (datePickerFields.includes(fieldId)) {
            return (
                <DateTimePicker
                    disabled={!editMode}
                    key={fieldId}
                    label={FieldLabels[fieldId]}
                    value={
                        dayjs(fieldValues[fieldId] as string).isValid()
                            ? dayjs(fieldValues[fieldId] as string)
                            : null
                    }
                    onChange={(newValue) =>
                        dayjs(newValue).isValid() &&
                        changeFieldValue(fieldId, newValue.toISOString())
                    }
                    slotProps={{
                        textField: {
                            required: RequiredFields[name].includes(fieldId),
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
                    required={RequiredFields[name].includes(fieldId)}
                    control={
                        <Checkbox
                            disabled={!editMode}
                            checked={fieldValues[fieldId] as boolean}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                changeFieldValue(fieldId, event.target.checked)
                            }
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
                    editMode={editMode}
                    value={fieldValues[fieldId] as string}
                    changeFieldValue={changeFieldValue}
                />
            );
        }
        return (
            <TextField
                disabled={!editMode}
                key={fieldId}
                label={FieldLabels[fieldId]}
                name={fieldId}
                required={RequiredFields[name].includes(fieldId)}
                value={fieldValues[fieldId]}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    changeFieldValue(fieldId, event.target.value);
                }}
                {...(passwordFields.includes(fieldId) && {
                    type: GlobalConstants.PASSWORD,
                })}
            />
        );
    };

    return (
        <Card component="form" onSubmit={submitForm}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <CardHeader title={FieldLabels[name]} />
                {editable &&
                    (editMode ? (
                        <Cancel
                            sx={{ padding: 2, cursor: "pointer" }}
                            onClick={() => {
                                setFieldValues(getFieldValues(name, defaultValues));
                                setEditMode(false);
                            }}
                        />
                    ) : (
                        <Edit sx={{ padding: 2 }} onClick={() => setEditMode(true)} />
                    ))}
            </Stack>

            <CardContent sx={{ display: "flex", flexDirection: "column", rowGap: 2 }}>
                <Stack spacing={2}>
                    {RenderedFields[name].map((fieldId) => getFieldComp(fieldId))}
                </Stack>
                {getFormActionMsg(actionState)}
                {editMode && (
                    <Button type="submit" variant="contained" disabled={loading}>
                        {buttonLabel}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default Form;
