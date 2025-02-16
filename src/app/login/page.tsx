"use client";

import GlobalConstants from "../GlobalConstants";
import Form from "../ui/form/Form";
import { useUserContext } from "../context/UserContext";

const LoginForm: React.FC = () => {
  const { login } = useUserContext();

  return (
    <Form
      name={GlobalConstants.LOGIN}
      buttonLabel={GlobalConstants.LOGIN}
      action={login}
    />
  );
};

export default LoginForm;
