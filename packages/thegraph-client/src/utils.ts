import TypedEmitter, { Arguments } from "typed-emitter";

export const waitFor = <T, E extends keyof T>(
  emitter: TypedEmitter<T>,
  event: E
): Promise<Arguments<T[E]>[0]> => {
  return new Promise((r: any) => emitter.on(event, r));
};
