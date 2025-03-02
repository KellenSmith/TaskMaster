"use client";

import {
    Autocomplete,
    Button,
    Card,
    CardContent,
    CardHeader,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { useState, FC, ChangeEvent, ReactElement } from "react";
import {
    FieldLabels,
    RenderedFields,
    selectFieldOptions,
    RequiredFields,
    datePickerFields,
    multiLineFields,
    allowSelectMultiple,
} from "./FieldCfg";
import { DateTimeField } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import GlobalConstants from "../../GlobalConstants";

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

export const getFormActionMsg = (formActionState: FormActionState): ReactElement | null => {
    if (formActionState.errorMsg)
        return <Typography color="error">{formActionState.errorMsg}</Typography>;
    if (formActionState.result)
        return <Typography color="success">{formActionState.result}</Typography>;
};

interface FormProps {
    name: string;
    buttonLabel: string;
    action: (currentActionState: FormActionState, fieldValues: any) => Promise<FormActionState>; // eslint-disable-line no-unused-vars
    defaultValues?: any;
    readOnly?: boolean;
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
            } else fieldValues[fieldId] = "";
        }
    }
    return fieldValues;
};

const Form: FC<FormProps> = ({ name, buttonLabel, action, defaultValues, readOnly = false }) => {
    const [fieldValues, setFieldValues] = useState<{ [key: string]: string | string[] }>(
        getFieldValues(name, defaultValues),
    );
    const [loading, setLoading] = useState(false);
    const [actionState, setActionState] = useState(defaultActionState);

    const changeFieldValue = (fieldId: string, value: string | string[]) => {
        setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    };

    const submitForm = async (event) => {
        event.preventDefault();
        setLoading(true);
        const newActionState = await action(actionState, fieldValues);
        setActionState(newActionState);
        setLoading(false);
    };

    const getFieldComp = (fieldId: string) => {
        if (fieldId in selectFieldOptions) {
            return (
                <Autocomplete
                    readOnly={readOnly}
                    key={fieldId}
                    renderInput={(params) => <TextField {...params} label={FieldLabels[fieldId]} />}
                    autoSelect={fieldId in RequiredFields[name]}
                    options={selectFieldOptions[fieldId]}
                    value={fieldValues[fieldId]}
                    onChange={(_, newValue) =>
                        changeFieldValue(fieldId, newValue as string | string[])
                    }
                    multiple={allowSelectMultiple.includes(fieldId)}
                ></Autocomplete>
            );
        }
        if (datePickerFields.includes(fieldId)) {
            return (
                <DateTimeField
                    disabled={readOnly}
                    key={fieldId}
                    label={FieldLabels[fieldId]}
                    value={
                        dayjs(fieldValues[fieldId] as string).isValid()
                            ? dayjs(fieldValues[fieldId] as string)
                            : null
                    }
                    onChange={(newValue) =>
                        newValue.isValid() && changeFieldValue(fieldId, newValue.toISOString())
                    }
                />
            );
        }
        return (
            <TextField
                disabled={readOnly}
                key={fieldId}
                label={FieldLabels[fieldId]}
                name={fieldId}
                required={RequiredFields[name].includes(fieldId)}
                multiline={multiLineFields.includes(fieldId)}
                value={fieldValues[fieldId]}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    changeFieldValue(fieldId, event.target.value);
                }}
                {...(fieldId.includes(GlobalConstants.PASSWORD) && {
                    type: GlobalConstants.PASSWORD,
                })}
            />
        );
    };

    return (
        <Card component="form" onSubmit={submitForm}>
            <CardHeader title={FieldLabels[name]} />
            <CardContent sx={{ display: "flex", flexDirection: "column", rowGap: 2 }}>
                <Stack spacing={2}>
                    {RenderedFields[name].map((fieldId) => getFieldComp(fieldId))}
                </Stack>
                {getFormActionMsg(actionState)}
                {!readOnly && (
                    <Button type="submit" variant="contained" disabled={loading}>
                        {buttonLabel}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default Form;
