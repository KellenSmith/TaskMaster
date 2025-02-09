import GlobalConstants from "../GlobalConstants";
import { createUser } from "../lib/actions";
import Form from "../ui/Form";

const UserForm = () => {
  const renderedFields = [
    GlobalConstants.FIRST_NAME,
    GlobalConstants.SURNAME,
    GlobalConstants.NICKNAME,
    GlobalConstants.EMAIL,
    GlobalConstants.PHONE,
    GlobalConstants.ROLE,
    GlobalConstants.STATUS,
  ];

  return (
    <Form
      title={"User"}
      renderedFields={renderedFields}
      buttonLabel="create"
      action={createUser}
    />
  );
};

export default UserForm;
