type Result = { data: unknown; error: unknown; count?: number };

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
  builder.insert = chain("insert");
  builder.update = chain("update");
  builder.delete = chain("delete");
  builder.maybeSingle = () => Promise.resolve(result);
  builder.single = () => Promise.resolve(result);
  // Awaiting the builder itself resolves the result (for list/count/write queries).
  (builder as unknown as { then: unknown }).then = (
    onFulfilled: (r: Result) => unknown
  ) => Promise.resolve(result).then(onFulfilled);
  return {
    from: () => builder,
    calls,
  };
}
