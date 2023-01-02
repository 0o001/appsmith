import { ActionCalledInSyncFieldError } from "workers/Evaluation/errorModifier";

export function addFn(
  ctx: typeof globalThis,
  fn: (...args: any[]) => any,
  fnGuards: Array<(func: typeof fn) => void>,
) {
  Object.defineProperty(ctx, fn.name, {
    value: function(...args: any[]) {
      for (const guard of fnGuards) {
        guard(fn);
      }
      return fn(...args);
    },
    configurable: true,
    writable: true,
    enumerable: false,
  });
}

export function isAsyncGuard(fn: (...args: any[]) => any) {
  if (!self.ALLOW_ASYNC) {
    self.IS_ASYNC = true;
    throw new ActionCalledInSyncFieldError(fn.name);
  }
}
