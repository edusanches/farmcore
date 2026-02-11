"use server"

import { signIn } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { loginSchema, registerSchema } from "@/lib/validators"
import bcryptjs from "bcryptjs"
import { AuthError } from "next-auth"

export async function login(_prevState: unknown, formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const validated = loginSchema.safeParse(raw)

  if (!validated.success) {
    return {
      error: "Dados de login inválidos. Verifique os campos e tente novamente.",
    }
  }

  try {
    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "E-mail ou senha incorretos." }
        default:
          return { error: "Ocorreu um erro ao fazer login. Tente novamente." }
      }
    }
    throw error
  }

  return { error: null }
}

export async function register(_prevState: unknown, formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    farmName: formData.get("farmName") as string,
  }

  const validated = registerSchema.safeParse(raw)

  if (!validated.success) {
    return {
      error:
        "Dados de cadastro inválidos. Verifique os campos e tente novamente.",
    }
  }

  const { name, email, password, farmName } = validated.data

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { error: "Já existe uma conta com este e-mail." }
    }

    const hashedPassword = await bcryptjs.hash(password, 12)

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
        },
      })

      const farm = await tx.farm.create({
        data: {
          name: farmName,
        },
      })

      await tx.farmMembership.create({
        data: {
          userId: user.id,
          farmId: farm.id,
          role: "OWNER",
        },
      })
    })

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Conta criada, mas houve um erro ao fazer login automático. Tente fazer login manualmente.",
      }
    }
    throw error
  }

  return { error: null }
}
