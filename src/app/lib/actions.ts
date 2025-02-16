"use server";

import { Prisma, PrismaPromise } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { FormActionState } from "../ui/form/Form";
import { RenderedFields } from "../ui/form/FieldCfg";
import GlobalConstants from "../GlobalConstants";
import { DatagridActionState } from "../ui/Datagrid";
import {
  authenticateUser,
  createSession,
  decryptJWT,
  generateUserCredentials,
  getUserByUniqueKey,
} from "./auth/auth";
import dayjs from "dayjs";

const getStrippedFormData = (formData: FormData): any => {
  const strippedFormData = Object.fromEntries(
    formData.entries().filter(([_, value]) => !!value)
  );
  return strippedFormData;
};

export const createUser = async (
  currentActionState: FormActionState,
  formData: FormData
): Promise<FormActionState> => {
  const newActionState = { ...currentActionState };
  // Get props in formData which are part of the user schema
  const strippedFormData: Prisma.UserCreateInput = getStrippedFormData(
    formData
  ) as Prisma.UserCreateInput;

  try {
    const createdUser = await prisma.user.create({
      data: {
        ...strippedFormData,
      },
    });
    newActionState.errorMsg = "";
    newActionState.status = 201;
    newActionState.result = `User #${createdUser[GlobalConstants.ID]} ${
      createdUser[GlobalConstants.NICKNAME]
    } created successfully`;
  } catch (error) {
    newActionState.status = 500;
    newActionState.errorMsg = error.message;
    newActionState.result = "";
  }
  return newActionState;
};

export const getAllUsers = async (
  currentState: DatagridActionState
): Promise<DatagridActionState> => {
  const newActionState: DatagridActionState = { ...currentState };
  try {
    const users: Prisma.UserCreateInput[] = await prisma.user.findMany();
    newActionState.status = 200;
    newActionState.result = users;
  } catch (error) {
    newActionState.status = 500;
    newActionState.errorMsg = error.message;
  }
  return newActionState;
};

export const getLoggedInUser = async (
  currentActionState: FormActionState
): Promise<FormActionState> => {
  const newActionState = { ...currentActionState };
  const jwtPayload = await decryptJWT();
  if (jwtPayload) {
    const loggedInUser = await getUserByUniqueKey(
      GlobalConstants.ID,
      jwtPayload[GlobalConstants.ID] as string
    );
    newActionState.status = 200;
    newActionState.errorMsg = "";
    newActionState.result = JSON.stringify(loggedInUser);
  } else {
    newActionState.status = 404;
    newActionState.errorMsg = "";
    newActionState.result = "";
  }
  return newActionState;
};

export const login = async (
  currentActionState: FormActionState,
  formData: FormData
): Promise<FormActionState> => {
  const newActionState = { ...currentActionState };
  try {
    const loggedInUser = await authenticateUser(formData);
    newActionState.status = 200;
    newActionState.errorMsg = "";
    newActionState.result = JSON.stringify(loggedInUser);
  } catch (error) {
    newActionState.status = 403;
    newActionState.errorMsg = error.message;
    newActionState.result = "";
    return newActionState;
  }

  await createSession(formData);
  return newActionState;
};

type UserIdentifier = {
  id?: string;
  email?: string;
};

const updateUserTransaction = (
  formData: FormData,
  userIdentifier: UserIdentifier
): Prisma.PrismaPromise<any> => {
  // Get props in formData which are part of the user schema
  const strippedFormData: Prisma.UserUpdateInput = getStrippedFormData(
    formData
  ) as Prisma.UserUpdateInput;
  console.log(strippedFormData);
  return prisma.user.update({
    where: userIdentifier as unknown as Prisma.UserWhereUniqueInput,
    data: strippedFormData,
  });
};

export const updateUser = async (
  userId: string,
  currentActionState: FormActionState,
  formData: FormData
): Promise<FormActionState> => {
  const newActionState = { ...currentActionState };
  const userIdentifier: UserIdentifier = {
    [GlobalConstants.ID]: userId,
  };
  try {
    await updateUserTransaction(formData, userIdentifier);
    newActionState.errorMsg = "";
    newActionState.status = 200;
    newActionState.result = `Updated successfully`;
  } catch (error) {
    newActionState.status = 500;
    newActionState.errorMsg = error.message;
    newActionState.result = null;
  }
  return newActionState;
};

export const updateUserCredentials = async (
  currentActionState: FormActionState,
  formData: FormData
): Promise<FormActionState> => {
  const newActionState = { ...currentActionState };
  const newCredentials = await generateUserCredentials(
    formData.get(GlobalConstants.PASSWORD) as string
  );
  try {
    await prisma.userCredentials.update({
      where: {
        [GlobalConstants.EMAIL]: formData.get(GlobalConstants.EMAIL),
      } as unknown as Prisma.UserCredentialsWhereUniqueInput,
      data: newCredentials,
    });
    newActionState.errorMsg = "";
    newActionState.status = 200;
    newActionState.result = "Updated successfully";
  } catch (error) {
    newActionState.status = 500;
    newActionState.errorMsg = error.message;
    newActionState.result = "";
  }
  return newActionState;
};

const createUserCredentialsTransaction = (
  generatedUserCredentials: Prisma.UserCredentialsCreateInput
): PrismaPromise<any> => {
  const transaction = prisma.userCredentials.create({
    data: generatedUserCredentials,
  });
  return transaction;
};

const getGeneratedUserCredentials = async (
  userEmail: string
): Promise<Prisma.UserCredentialsCreateWithoutUserInput> => {
  const generatedPassword = "123456"; // await bcrypt.genSalt()
  const generatedUserCredentials = await generateUserCredentials(
    generatedPassword
  );
  generatedUserCredentials[GlobalConstants.EMAIL] = userEmail;
  return generatedUserCredentials;
};

export const createUserCredentials = async (
  userEmail: string,
  currentActionState: FormActionState
): Promise<FormActionState> => {
  const newActionState = { ...currentActionState };
  const generatedUserCredentials = (await getGeneratedUserCredentials(
    userEmail
  )) as Prisma.UserCredentialsCreateInput;
  try {
    await createUserCredentialsTransaction(generatedUserCredentials);
    newActionState.status = 201;
    newActionState.errorMsg = "";
    newActionState.result = "";
  } catch (error) {
    newActionState.status = 500;
    newActionState.errorMsg = error.message;
    newActionState.result = "";
  }
  return newActionState;
};

export const validateUserMembership = async (
  userEmail: string,
  currentActionState: FormActionState
): Promise<FormActionState> => {
  const newActionState = { ...currentActionState };
  const newUserData = new FormData();
  newUserData.append(GlobalConstants.MEMBERSHIP_RENEWED, dayjs().toISOString());
  const userIdentifier: UserIdentifier = {
    [GlobalConstants.EMAIL]: userEmail,
  };
  const generatedUserCredentials = (await getGeneratedUserCredentials(
    userEmail
  )) as Prisma.UserCredentialsCreateInput;
  const credentialsTransaction = createUserCredentialsTransaction(
    generatedUserCredentials
  );
  const userTransaction = updateUserTransaction(newUserData, userIdentifier);

  try {
    await prisma.$transaction([credentialsTransaction, userTransaction]);
    // Email new credentials to user email
    newActionState.status = 200;
    newActionState.errorMsg = "";
    newActionState.result = "Validated membership";
  } catch (error) {
    newActionState.status = 500;
    newActionState.errorMsg = error.message;
    newActionState.result = "";
  }
  return newActionState;
};

export const deleteUser = async (
  userEmail: string,
  currentActionState: FormActionState
): Promise<FormActionState> => {
  const newActionState = { ...currentActionState };
  try {
    const deleteCredentials = prisma.userCredentials.deleteMany({
      where: {
        [GlobalConstants.EMAIL]: userEmail,
      },
    });
    const deleteUser = prisma.user.delete({
      where: {
        [GlobalConstants.EMAIL]: userEmail,
      } as unknown as Prisma.UserWhereUniqueInput,
    });

    /**
     * Delete credentials and user in a transaction where all actions must
     * succeed or no action is taken to preserve data integrity.
     */
    await prisma.$transaction([deleteCredentials, deleteUser]);

    newActionState.errorMsg = "";
    newActionState.status = 200;
    newActionState.result = "";
  } catch (error) {
    newActionState.status = 500;
    newActionState.errorMsg = error.message;
    newActionState.result = "";
  }
  return newActionState;
};
