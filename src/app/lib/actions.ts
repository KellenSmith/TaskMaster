"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { FormActionState } from "../ui/form/Form";
import { RenderedFields } from "../ui/form/FieldCfg";
import GlobalConstants from "../GlobalConstants";

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
    const createdUser = await prisma.user.create({
      data: strippedFormData as Prisma.UserCreateInput,
    });
    newActionState.status = 201;
    newActionState.result = `User #${createdUser[GlobalConstants.ID]} ${
      createdUser[GlobalConstants.NICKNAME]
    } created successfully`;
    return newActionState;
  } catch (error) {
    newActionState.status = 500;
    newActionState.errorMsg = error.message;
    return newActionState;
  }
};
