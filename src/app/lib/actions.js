"use server";

export const createUser = async (formData) => {
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }
  return { status: 201 };
};
