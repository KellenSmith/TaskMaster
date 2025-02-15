"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
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

const getStrippedFormData = (formName: string, formData: FormData): object => {
  const rawFormData = Object.fromEntries(
    RenderedFields[formName].map((key) => [key, formData.get(key)])
  );
  const strippedFormData = Object.fromEntries(
    Object.entries(rawFormData).filter(([_, value]) => !!value)
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
    GlobalConstants.USER,
    formData
  ) as Prisma.UserCreateInput;
  const generatedPassword = await bcrypt.genSalt();
  const generatedUserCredentials: Prisma.UserCredentialsCreateWithoutUserInput =
    await generateUserCredentials(generatedPassword);
  try {
    const createdUser = await prisma.user.create({
      data: {
        ...strippedFormData,
        [GlobalConstants.USER_CREDENTIALS]: {
          create: generatedUserCredentials,
        },
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
    newActionState.result = null;
  }
  return newActionState;
};

export const getAllUsers = async (
  currentState: DatagridActionState
): Promise<DatagridActionState> => {
  const newActionState: DatagridActionState = { ...currentState };
  try {
    const users: Array<object> = await prisma.user.findMany();
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

export const updateUser = async (
  userId: string,
  currentActionState: FormActionState,
  formData: FormData
): Promise<FormActionState> => {
  const newActionState = { ...currentActionState };
  // Get props in formData which are part of the user schema
  const strippedFormData: Prisma.UserUpdateInput = getStrippedFormData(
    GlobalConstants.USER,
    formData
  ) as Prisma.UserUpdateInput;
  try {
    await prisma.user.update({
      where: {
        [GlobalConstants.ID]: userId,
      } as unknown as Prisma.UserWhereUniqueInput,
      data: strippedFormData,
    });
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
