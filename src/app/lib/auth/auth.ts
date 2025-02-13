import bcrypt from "bcrypt";

import GlobalConstants from "../../GlobalConstants";
import { Prisma } from "@prisma/client";

export const generateUserCredentials =
  async (): Promise<Prisma.UserCredentialsCreateWithoutUserInput> => {
    const salt = await bcrypt.genSalt();
    const generatedPassword = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);
    const newUserCredentials = {
      [GlobalConstants.SALT]: salt,
      [GlobalConstants.HASHED_PASSWORD]: hashedPassword,
    } as Prisma.UserCredentialsCreateWithoutUserInput;
    return newUserCredentials;
  };
