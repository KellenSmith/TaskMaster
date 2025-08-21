"use server";
import { getLoggedInUser } from "../../lib/user-actions";
import ProfileDashboard from "./ProfileDashboard";

const ProfilePage = async () => {
    const loggedInUser = await getLoggedInUser();

    return <ProfileDashboard />;
};

export default ProfilePage;
