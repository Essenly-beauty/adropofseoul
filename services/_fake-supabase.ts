type Result = { data: unknown; error: unknown };

export function fakeClient(result: Result) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = chain;
  builder.eq = chain;
  builder.order = chain;
  builder.limit = chain;
  builder.range = chain;
  builder.maybeSingle = () => Promise.resolve(result);
  // Awaiting the builder itself resolves the result (for list queries).
  (builder as { then: unknown }).then = (onFulfilled: (r: Result) => unknown) =>
    Promise.resolve(result).then(onFulfilled);
  return {
    from: () => builder,
  };
}
