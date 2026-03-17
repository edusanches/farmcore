import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

export function getEncryptionKey(): Buffer {
  const keyHex = process.env.NFE_ENCRYPTION_KEY
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "NFE_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)"
    )
  }
  return Buffer.from(keyHex, "hex")
}

export interface EncryptResult {
  encrypted: Buffer
  iv: string
  authTag: string
}

export function encryptData(plaintext: Buffer): EncryptResult {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })

  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  }
}

export function decryptData(
  encrypted: Buffer | Uint8Array,
  iv: string,
  authTag: string
): Buffer {
  const key = getEncryptionKey()
  const inputBuffer = Buffer.isBuffer(encrypted)
    ? encrypted
    : Buffer.from(encrypted)
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, "hex"),
    { authTagLength: AUTH_TAG_LENGTH }
  )
  decipher.setAuthTag(Buffer.from(authTag, "hex"))

  return Buffer.concat([decipher.update(inputBuffer), decipher.final()])
}

export function encryptString(text: string): EncryptResult {
  return encryptData(Buffer.from(text, "utf-8"))
}

export function decryptString(
  encrypted: Buffer | Uint8Array,
  iv: string,
  authTag: string
): string {
  return decryptData(encrypted, iv, authTag).toString("utf-8")
}
