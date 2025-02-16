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
import { useActionState, useState, Fragment } from "react";
import {
  FieldLabels,
  RenderedFields,
  selectFieldOptions,
  RequiredFields,
  datePickerFields,
} from "./FieldCfg";
import { DatePicker } from "@mui/x-date-pickers";
import { Dayjs } from "dayjs";
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

interface FormProps {
  name: string;
  buttonLabel: string;
  action: (
    currentActionState: FormActionState,
    formData: FormData,
  ) => Promise<FormActionState>;
  defaultValues?: any;
}

const Form: React.FC<FormProps> = ({
  name,
  buttonLabel,
  action,
  defaultValues,
}) => {
  const [actionState, formAction, isPending] = useActionState(
    action,
    defaultActionState,
  );
  const [dateFieldValues, setDateFieldValues] = useState<{
    [key: string]: Dayjs | null;
  }>(
    Object.fromEntries(
      RenderedFields[name].map((fieldId) => [fieldId, null]),
    ),
  );

  const getStatusMsg = () => {
    if (actionState.errorMsg)
      return <Typography color="error">{actionState.errorMsg}</Typography>;
    if (actionState.result)
      return <Typography color="success">{actionState.result}</Typography>;
  };

  const getFieldComp = (fieldId: string) => {
    if (fieldId in selectFieldOptions) {
      const options = selectFieldOptions[fieldId];
      return (
        <Autocomplete
          key={fieldId}
          renderInput={(params) => (
            <TextField {...params} label={FieldLabels[fieldId]} />
          )}
          autoSelect={fieldId in RequiredFields[name]}
          options={options}
          defaultValue={
            defaultValues && fieldId in defaultValues
              ? defaultValues[fieldId]
              : options[0]
          }
          getOptionLabel={(option) => option[0].toUpperCase() + option.slice(1)}
        ></Autocomplete>
      );
    }
    if (datePickerFields.includes(fieldId)) {
      return (
        <Fragment key={fieldId}>
          <DatePicker
            key={fieldId}
            label={FieldLabels[fieldId]}
            defaultValue={
              defaultValues && fieldId in defaultValues
                ? defaultValues[fieldId]
                : null
            }
            value={dateFieldValues[fieldId] || null}
            onChange={(newValue) =>
              setDateFieldValues((prev) => ({ ...prev, [fieldId]: newValue }))
            }
          />
          <input
            key={`${fieldId}-hidden-input`}
            type="hidden"
            name={fieldId}
            value={
              dateFieldValues[fieldId]
                ? dateFieldValues[fieldId]!.toISOString()
                : ""
            }
          />
        </Fragment>
      );
    }
    return (
      <TextField
        key={fieldId}
        label={FieldLabels[fieldId]}
        name={fieldId}
        required={RequiredFields[name].includes(fieldId)}
        defaultValue={
          defaultValues && fieldId in defaultValues
            ? defaultValues[fieldId]
            : ""
        }
        {...(fieldId.includes(GlobalConstants.PASSWORD) && {
          type: GlobalConstants.PASSWORD,
        })}
      />
    );
  };

  return (
    <Card component="form" action={formAction}>
      <CardHeader title={FieldLabels[name]} />
      <CardContent sx={{ display: "flex", flexDirection: "column", rowGap: 2 }}>
        <Stack spacing={2}>
          {RenderedFields[name].map((fieldId) => getFieldComp(fieldId))}
        </Stack>
        {getStatusMsg()}
        <Button type="submit" variant="contained" disabled={isPending}>
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
};

export default Form;
