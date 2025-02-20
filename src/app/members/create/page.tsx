import GlobalConstants from "../../GlobalConstants";
import { createUser } from "../../lib/actions";
import Form from "../../ui/form/Form";

const CreateUserPage = () => {
    return <Form name={GlobalConstants.USER} buttonLabel="create" action={createUser} />;
};

export default CreateUserPage;
