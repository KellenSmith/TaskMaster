"use server";

import bcrypt from "bcrypt";
import { jwtVerify, JWTVerifyResult, SignJWT } from "jose";
import { cookies } from "next/headers";

import GlobalConstants from "../../GlobalConstants";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import dayjs from "dayjs";

export const generateUserCredentials =
  async (): Promise<Prisma.UserCredentialsCreateWithoutUserInput> => {
    const salt = await bcrypt.genSalt();
    const generatedPassword = await bcrypt.genSalt();
    console.log(generatedPassword);
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);
    const newUserCredentials = {
      [GlobalConstants.SALT]: salt,
      [GlobalConstants.HASHED_PASSWORD]: hashedPassword,
    } as Prisma.UserCredentialsCreateWithoutUserInput;
    return newUserCredentials;
  };

export const compareUserCredentials = async (formData: FormData) => {
  const filterParams = {
    [GlobalConstants.EMAIL]: formData.get(GlobalConstants.EMAIL),
  } as unknown;
  const userCredentials = await prisma.userCredentials.findUnique({
    where: filterParams as Prisma.UserCredentialsWhereUniqueInput,
  });
  if (!userCredentials) throw new Error("Please apply for membership");
  const passwordsMatch = await bcrypt.compare(
    formData.get(GlobalConstants.PASSWORD) as string,
    userCredentials[GlobalConstants.HASHED_PASSWORD]
  );
  if (!passwordsMatch) throw new Error("Invalid credentials");
};

const getEncryptionKey = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET);

const encryptJWT = async (
  loggedInUser: Prisma.UserWhereUniqueInput,
  expiresAt: Date
) => {
  // Encode the user ID as jwt
  const jwt = await new SignJWT({
    [GlobalConstants.ID]: loggedInUser[GlobalConstants.ID],
  })
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

const setUserDetails = async (
  loggedInUser: Prisma.UserWhereUniqueInput,
  expiresAt: Date
) => {
  const cookieStore = await cookies();
  cookieStore.set(GlobalConstants.USER, JSON.stringify(loggedInUser), {
    httpOnly: false,
    secure: true,
    expires: expiresAt,
  });
};

export const createSession = async (formData: FormData) => {
  const expiresAt = dayjs().add(10, "s").toDate();
  // Find the logged in user
  const userFilterParams = {
    [GlobalConstants.EMAIL]: formData.get(GlobalConstants.EMAIL),
  } as unknown;
  const loggedInUser = await prisma.user.findUnique({
    where: userFilterParams as Prisma.UserWhereUniqueInput,
  });

  await encryptJWT(loggedInUser, expiresAt);
  await setUserDetails(loggedInUser, expiresAt);
};

const decryptJWT = async (jwt: string): Promise<JWTVerifyResult> => {
  try {
    const jwtPayload = await jwtVerify(jwt, getEncryptionKey(), {
      algorithms: ["HS256"],
    });
    return jwtPayload;
  } catch (error) {}
};
