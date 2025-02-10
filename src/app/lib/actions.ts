"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { FormActionState } from "../ui/form/Form";
import { RenderedFields } from "../ui/form/FieldCfg";
import GlobalConstants from "../GlobalConstants";
import { DatagridActionState } from "../members/page";

const getStrippedFormData = (formName: string, formData: FormData) => {
  const rawFormData = Object.fromEntries(
    RenderedFields[formName].map((key) => [key, formData.get(key)])
  );
  const strippedFormData = Object.fromEntries(
    Object.entries(rawFormData).filter(([_, value]) => !!value)
  );
  return strippedFormData;
};

export const createUser = async (
  currentState: FormActionState,
  formData: FormData
) => {
  const newActionState = { ...currentState };
  // Get props in formData which are part of the user schema
  const strippedFormData = getStrippedFormData(GlobalConstants.USER, formData);
  try {
    const createdUser: Prisma.UserCreateInput = await prisma.user.create({
      data: strippedFormData as Prisma.UserCreateInput,
    });
    newActionState.status = 201;
    newActionState.result = `User #${createdUser[GlobalConstants.ID]} ${
      createdUser[GlobalConstants.NICKNAME]
    } created successfully`;
  } catch (error) {
    newActionState.status = 500;
    newActionState.errorMsg = error.message;
  }
  return newActionState;
};

export const getAllUsers = async (currentState: DatagridActionState) => {
  const newActionState: DatagridActionState = { ...currentState };
  try {
    const users: Array<object> = await prisma.user.findMany();
    newActionState.result = users;
  } catch (error) {
    newActionState.status = 500;
    newActionState.errorMsg = error.message;
  }
  return newActionState;
};
