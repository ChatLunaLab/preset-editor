import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updateNestedObject<T>(obj: T, path: string, value: any): T {
  const keys = path.split(".")
  if (keys.length === 0) return obj

  const result = Array.isArray(obj) ? ([...obj] as T) : ({ ...obj } as T)
  let target = result
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentValue = (current as any)[key]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let nextValue: any = {}
    if (Array.isArray(currentValue)) {
      nextValue = [...currentValue]
    } else if (currentValue !== undefined) {
      nextValue = { ...currentValue }
    }

    target[key as keyof typeof target] = nextValue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    current = (current as any)[key]
    target = nextValue
  }

  target[keys.at(-1) as keyof typeof target] = value
  return result
}

export async function sha1(str: string) {
  const data = new TextEncoder().encode(str)
  const buffer = await crypto.subtle.digest("SHA-1", data)
  return Array.from(new Uint8Array(buffer))
    .map((bytes) => bytes.toString(16).padStart(2, "0"))
    .join("")
}
