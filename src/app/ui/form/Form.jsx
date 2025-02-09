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
import { useActionState } from "react";
import FieldLabels from "./FieldLabels";
import { RenderedFields, selectFieldOptions, RequiredFields } from "./FieldCfg";

const defaultActionState = { status: 200, errorMsg: "", result: "" };

const Form = ({ name, buttonLabel, action }) => {
  const [actionState, formAction] = useActionState(action, defaultActionState);

  const getStatusMsg = () => {
    if (actionState.errorMsg)
      return <Typography color="error">{actionState.errorMsg}</Typography>;
    if (actionState.result)
      return <Typography color="success">{actionState.result}</Typography>;
  };

  const getFieldComp = (fieldId) => {
    if (fieldId in selectFieldOptions) {
      const options = selectFieldOptions[fieldId];
      return (
        <Autocomplete
          key={fieldId}
          name={fieldId}
          renderInput={(params) => (
            <TextField {...params} label={FieldLabels[fieldId]} />
          )}
          autoSelect={fieldId in RequiredFields[name]}
          options={options}
          defaultValue={options[0]}
          getOptionLabel={(option) => option[0].toUpperCase() + option.slice(1)}
        ></Autocomplete>
      );
    }
    return (
      <TextField
        key={fieldId}
        label={FieldLabels[fieldId]}
        name={fieldId}
        required={RequiredFields[name].includes(fieldId)}
      />
    );
  };

  return (
    <Card component="form" action={formAction} sx={{ height: "100%" }}>
      <CardHeader title={FieldLabels[name]} />
      <CardContent sx={{ display: "flex", flexDirection: "column", rowGap: 2 }}>
        <Stack spacing={2}>
          {RenderedFields[name].map((fieldId) => getFieldComp(fieldId))}
        </Stack>
        {getStatusMsg()}
        <Button type="submit" variant="contained">
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
};

export default Form;
