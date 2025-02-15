"use server";

import bcrypt from "bcryptjs";
import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

import GlobalConstants from "../../GlobalConstants";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import dayjs from "dayjs";

export const generateUserCredentials = async (
  password: string,
): Promise<Prisma.UserCredentialsCreateWithoutUserInput> => {
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);
  const newUserCredentials = {
    [GlobalConstants.SALT]: salt,
    [GlobalConstants.HASHED_PASSWORD]: hashedPassword,
  } as Prisma.UserCredentialsCreateWithoutUserInput;
  return newUserCredentials;
};

export const authenticateUser = async (formData: FormData) => {
  const filterParams = {
    [GlobalConstants.EMAIL]: formData.get(GlobalConstants.EMAIL),
  } as unknown;
  const userCredentials = await prisma.userCredentials.findUnique({
    where: filterParams as Prisma.UserCredentialsWhereUniqueInput,
  });
  if (!userCredentials) throw new Error("Please apply for membership");
  const passwordsMatch = await bcrypt.compare(
    formData.get(GlobalConstants.PASSWORD) as string,
    userCredentials[GlobalConstants.HASHED_PASSWORD],
  );
  if (!passwordsMatch) throw new Error("Invalid credentials");

  const loggedInUser = getUserByUniqueKey(
    GlobalConstants.EMAIL,
    userCredentials[GlobalConstants.EMAIL],
  );
  return loggedInUser;
};

const getEncryptionKey = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET);

const encryptJWT = async (
  loggedInUser: Prisma.UserWhereUniqueInput,
  expiresAt: Date,
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
  value: string,
): Promise<Prisma.UserWhereUniqueInput | null> => {
  const userFilterParams = {
    [key]: value,
  } as unknown;
  const loggedInUser = await prisma.user.findUnique({
    where: userFilterParams as Prisma.UserWhereUniqueInput,
  });
  return loggedInUser;
};

export const createSession = async (formData: FormData) => {
  const expiresAt = dayjs().add(60, "s").toDate();
  const loggedInUser = await getUserByUniqueKey(
    GlobalConstants.EMAIL,
    formData.get(GlobalConstants.EMAIL) as string,
  );

  await encryptJWT(loggedInUser, expiresAt);
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
