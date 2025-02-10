import GlobalConstants from "../../GlobalConstants";
import { createUser } from "../../lib/actions";
import Form from "../../ui/form/Form";

const CreateUserPage = () => {
  return (
    <div>
      <Form
        name={GlobalConstants.USER}
        buttonLabel="create"
        action={createUser}
      />
    </div>
  );
};

export default CreateUserPage;
