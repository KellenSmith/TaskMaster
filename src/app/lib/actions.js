"use server";

import { PrismaClient } from "@prisma/client";
import { RenderedFields } from "../ui/form/FieldCfg";
import GlobalConstants from "../GlobalConstants";

const stripEmpty = (formData) =>
  Object.fromEntries(
    Object.entries(formData).filter(([_, value]) => value !== "")
  );

const getStrippedFormData = (formName, formData) => {
  const rawFormData = Object.fromEntries(
    RenderedFields[formName].map((key) => [key, formData.get(key)])
  );
  return stripEmpty(rawFormData);
};

export const createUser = async (currentState, formData) => {
  const strippedFormData = getStrippedFormData(GlobalConstants.USER, formData);
  const newActionState = { ...currentState };
  try {
    const prisma = new PrismaClient();
    const createdUser = await prisma.user.create({ data: strippedFormData });
    newActionState.status = 201;
    newActionState.result = createdUser;
    return newActionState;
  } catch (error) {
    newActionState.status = 500;
    newActionState.errorMsg = error.message;
    return newActionState;
  }
};
