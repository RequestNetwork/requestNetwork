/**
 * Utility to keep compatibility with Enum and generate a union type
 * @see https://rlee.dev/writing/stop-misusing-typescript-string-enums
 */
export type EnumToType<T> = T[keyof T];
