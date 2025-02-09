import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  TextField,
} from "@mui/material";
import FieldLabels from "./FieldLabels";

const Form = ({ title, renderedFields, buttonLabel, action }) => {
  return (
    <Card component="form" action={action}>
      <CardHeader title={title} />
      <CardContent sx={{ display: "flex", flexDirection: "column", rowGap: 2 }}>
        <Stack spacing={2}>
          {renderedFields.map((fieldId) => (
            <TextField
              key={fieldId}
              label={FieldLabels[fieldId]}
              name={fieldId}
            />
          ))}
        </Stack>
        <Button type="submit" variant="contained">
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
};

export default Form;
