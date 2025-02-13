"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { FormActionState } from "../ui/form/Form";
import { RenderedFields } from "../ui/form/FieldCfg";
import GlobalConstants from "../GlobalConstants";
import { DatagridActionState } from "../members/page";
import {
  compareUserCredentials,
  createSession,
  generateUserCredentials,
} from "./auth/auth";
import { redirect } from "next/navigation";

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
  const generatedUserCredentials: Prisma.UserCredentialsCreateWithoutUserInput =
    await generateUserCredentials();
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

export const login = async (
  currentActionState: FormActionState,
  formData: FormData
): Promise<FormActionState> => {
  const newActionState = { ...currentActionState };
  try {
    await compareUserCredentials(formData);
  } catch (error) {
    newActionState.status = 403;
    newActionState.errorMsg = error.message;
    newActionState.result = "";
    return newActionState;
  }

  await createSession(formData);
  redirect("/");
};
