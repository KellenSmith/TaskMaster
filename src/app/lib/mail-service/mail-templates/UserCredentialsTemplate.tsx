import { Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";

/**
 * Props for the UserCredentialsTemplate component.
 * @property userEmail - The email address of the user.
 * @property password - The password assigned to the user.
 */
interface IUserCredentialsTemplateProps {
    userEmail: string;
    password: string;
    organization_name?: string;
    organizationName?: string;
}

const UserCredentialsTemplate: FC<IUserCredentialsTemplateProps> = ({
    userEmail,
    password,
    organization_name,
    organizationName,
}) => {
    const org = organization_name ?? organizationName ?? "";
    return (
        <MailTemplate organizationName={organizationName}>
            <Text>{`You have a new password for your account at ${org}!`}</Text>
            <Text> You can now log in with the following credentials:</Text>
            <Text>Email: {userEmail}</Text>
            <Text>Password: {password}</Text>
        </MailTemplate>
    );
};

export default UserCredentialsTemplate;
