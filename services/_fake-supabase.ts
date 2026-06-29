type Result = { data: unknown; error: unknown };

export function fakeClient(result: Result) {
  const calls: string[] = [];
  const builder: Record<string, unknown> & { calls: string[] } = { calls };
  const chain =
    (name: string) =>
    (..._args: unknown[]) => {
      calls.push(name);
      return builder;
    };
  builder.select = chain("select");
  builder.eq = chain("eq");
  builder.order = chain("order");
  builder.limit = chain("limit");
  builder.range = chain("range");
  builder.maybeSingle = () => Promise.resolve(result);
  // Awaiting the builder itself resolves the result (for list queries).
  (builder as unknown as { then: unknown }).then = (
    onFulfilled: (r: Result) => unknown
  ) => Promise.resolve(result).then(onFulfilled);
  return {
    from: () => builder,
    calls,
  };
}
