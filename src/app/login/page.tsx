"use client";

import GlobalConstants from "../GlobalConstants";
import Form from "../ui/form/Form";
import { useUserContext } from "../context/UserContext";
import { Button, Stack } from "@mui/material";
import { FieldLabels } from "../ui/form/FieldCfg";
import { redirect } from "next/navigation";

const LoginForm: React.FC = () => {
  const { login } = useUserContext();

  return (
    <Stack>
      <Form
        name={GlobalConstants.LOGIN}
        buttonLabel={GlobalConstants.LOGIN}
        action={login}
      />
      <Button onClick={()=>redirect(`/${GlobalConstants.APPLY}`)}>{FieldLabels[GlobalConstants.APPLY]}</Button>
    </Stack>
    
    
  );
};

export default LoginForm;
