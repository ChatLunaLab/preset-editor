import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function updateNestedObject<T>(
  obj: T,
  path: string,
  value: any
): T {
  const keys = path.split('.');
  if (keys.length === 0) return obj;

  const result = Array.isArray(obj) ? [...obj] as T : { ...obj } as T
  let target = result;
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const currentValue = (current as any)[key];
    
    // Create or copy next level
    const nextValue = currentValue === undefined
      ? {}
      : Array.isArray(currentValue)
        ? [...currentValue]
        : { ...currentValue };

    target[key as keyof typeof target] = nextValue;
    target = nextValue;
    current = (current as any)[key];
  }

  const lastKey = keys[keys.length - 1];
  target[lastKey as keyof typeof target] = value;

  return result
}
