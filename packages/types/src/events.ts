import TypedEmitter from 'typed-emitter';

export type ConfirmationEventEmitter<T> = TypedEmitter<{
  confirmed: (receipt: T) => void;
  error: (error: unknown) => void;
}>;
