import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updateNestedObject<T>(obj: T, path: string, value: any): T {
    const keys = path.split(".");
    if (keys.length === 0) return obj;

    const result = Array.isArray(obj) ? ([...obj] as T) : ({ ...obj } as T);
    let target = result;
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentValue = (current as any)[key];

        // Create or copy next level
        const nextValue =
            currentValue === undefined
                ? {}
                : Array.isArray(currentValue)
                ? [...currentValue]
                : { ...currentValue };

        target[key as keyof typeof target] = nextValue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        current = (current as any)[key];
        target = nextValue;
    }

    const lastKey = keys[keys.length - 1];
    target[lastKey as keyof typeof target] = value;

    return result;
}


export async function sha1(str: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str)
    const buffer = await crypto.subtle.digest("SHA-1", data)
    
    const hashArray = Array.from(new Uint8Array(buffer))
    const hashHex = hashArray.map((bytes) => bytes.toString(16).padStart(2, "0")).join("")

    return hashHex
}