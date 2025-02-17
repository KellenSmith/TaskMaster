"use server";

import bcrypt from "bcryptjs";
import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

import GlobalConstants from "../../GlobalConstants";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import dayjs from "dayjs";
import { FormActionState } from "../../ui/form/Form";

export const generateUserCredentials = async (
  password: string
): Promise<Prisma.UserCredentialsCreateWithoutUserInput> => {
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);
  const newUserCredentials = {
    [GlobalConstants.SALT]: salt,
    [GlobalConstants.HASHED_PASSWORD]: hashedPassword,
  } as Prisma.UserCredentialsCreateWithoutUserInput;
  return newUserCredentials;
};

export const createSession = async (formData: FormData) => {
  const expiresAt = dayjs().add(1, "d").toDate();
  const loggedInUser = await getUserByUniqueKey(
    GlobalConstants.EMAIL,
    formData.get(GlobalConstants.EMAIL) as string
  );

  await encryptJWT(loggedInUser, expiresAt);
};

export const login = async (
  currentActionState: FormActionState,
  formData: FormData
): Promise<FormActionState> => {
  const authState = { ...currentActionState };

  const loggedInUser = await getUserByUniqueKey(
    GlobalConstants.EMAIL,
    formData.get(GlobalConstants.EMAIL) as string
  );

  if (!loggedInUser) {
    authState.status = 404;
    authState.errorMsg = "Please apply for membership";
    authState.result = "";
    return authState;
  }
  if (!loggedInUser[GlobalConstants.MEMBERSHIP_RENEWED]) {
    authState.status = 403;
    authState.errorMsg = "Membership pending";
    authState.result = "";
    return authState;
  }

  const userCredentials = await prisma.userCredentials.findUnique({
    where: {
      [GlobalConstants.EMAIL]: formData.get(GlobalConstants.EMAIL),
    } as any as Prisma.UserCredentialsWhereUniqueInput,
  });

  const passwordsMatch = await bcrypt.compare(
    formData.get(GlobalConstants.PASSWORD) as string,
    userCredentials[GlobalConstants.HASHED_PASSWORD]
  );
  if (!passwordsMatch) {
    authState.status = 401;
    authState.errorMsg = "Invalid credentials";
    authState.result = "";
    return authState;
  }
  authState.result = JSON.stringify(loggedInUser);
  await createSession(formData);
  return authState;
};

const getEncryptionKey = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET);

const encryptJWT = async (
  loggedInUser: Prisma.UserWhereUniqueInput,
  expiresAt: Date
) => {
  // Encode the user ID as jwt
  const jwt = await new SignJWT(loggedInUser)
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getEncryptionKey());
  const cookieStore = await cookies();
  cookieStore.set(GlobalConstants.USER_CREDENTIALS, jwt, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
  });
};

export const getUserByUniqueKey = async (
  key: string,
  value: string
): Promise<Prisma.UserWhereUniqueInput | null> => {
  const userFilterParams = {
    [key]: value,
  } as unknown;
  const loggedInUser = await prisma.user.findUnique({
    where: userFilterParams as Prisma.UserWhereUniqueInput,
  });
  return loggedInUser;
};

export const decryptJWT = async (): Promise<JWTPayload> | undefined => {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(GlobalConstants.USER_CREDENTIALS)?.value;
    const result = await jwtVerify(cookie, getEncryptionKey(), {
      algorithms: ["HS256"],
    });
    const jwtPayload = result?.payload;
    return jwtPayload;
  } catch (error) {}
};

export const deleteUserCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(GlobalConstants.USER_CREDENTIALS);
};
