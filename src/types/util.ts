type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, ...0[]];
type Primitive = string | number | boolean | symbol | bigint;

export type NestedKeyOf<T, MaxDepth extends number = 7> = [MaxDepth] extends [never]
  ? never
  : T extends Primitive
  ? never
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  : T extends any // 分发联合类型
  ? T extends Array<infer U>
    ?
        | `${number}`
        | (U extends object
            ? `${number}.${NestedKeyOf<U, Prev[MaxDepth]>}`
            : never)
    : T extends object
    ? {
        [K in keyof T]: K extends string
          // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
          ? T[K] extends Function
            ? never
            : Exclude<T[K], undefined> extends Primitive
            ? `${K}`
            : Exclude<T[K], undefined> extends Array<infer A>
            ? A extends object
              ?
                    | `${K}`
                    | `${K}.${number}`
                    | `${K}.${number}.${NestedKeyOf<A, Prev[MaxDepth]>}`
              : `${K}` | `${K}.${number}`
            : Exclude<T[K], undefined> extends object
            ?
                  | `${K}`
                  | `${K}.${NestedKeyOf<Exclude<T[K], undefined>, Prev[MaxDepth]>}`
            : `${K}`
          : never;
      }[keyof T] extends infer S
      ? S extends string
        ? S
        : never
      : never
    : never
  : never;

export type GetNestedType<T, Path> = Path extends `${infer Head}.${infer Tail}`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ? T extends any // 分发联合类型
    ? T extends Array<infer A>
      ? Head extends `${number}`
        ? GetNestedType<A, Tail>
        : never
      : Head extends keyof T
      ? GetNestedType<Exclude<T[Head], undefined>, Tail>
      : never
    : never
  : Path extends keyof T
  ? T[Path]
  : Path extends `${number}`
  ? T extends Array<infer U>
    ? U
    : never
  : never;
