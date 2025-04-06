import { Text } from "@react-email/components";
import { OrgSettings } from "../../org-settings";
import GlobalConstants from "../../../GlobalConstants";
import MailTemplate from "./MailTemplate";
import { FC } from "react";
import { ReactNode } from "react";

/**
 * Props for the UserCredentialsTemplate component.
 * @property userEmail - The email address of the user.
 * @property password - The password assigned to the user.
 */
interface IUserCredentialsTemplateProps {
    userEmail: string;
    password: string;
}

const UserCredentialsTemplate: FC<IUserCredentialsTemplateProps> = async ({
    userEmail,
    password,
}): Promise<ReactNode> => {
    return (
        <MailTemplate>
            <Text>{`You have a new password for your account at ${OrgSettings[GlobalConstants.ORG_NAME]}!`}</Text>
            <Text> You can now log in with the following credentials:</Text>
            <Text>Email: {userEmail}</Text>
            <Text>Password: {password}</Text>
        </MailTemplate>
    );
};

export default UserCredentialsTemplate;
