export default async function retry<T>(
  name: string,
  fn: () => Promise<T>,
  { attempts = 10, initialDelayMs = 200, maxDelayMs = 5000 } = {},
): Promise<T> {
  let ms = initialDelayMs;
  for (let attempt = 1; ; attempt++)
    try {
      return await fn();
    } catch (err) {
      if (attempt >= attempts) throw err;
      console.log(
        `${name} not ready (attempt ${attempt}/${attempts}), retrying in ${ms} ms`,
      );
      await new Promise((r) => setTimeout(r, ms));
      ms = Math.min(ms * 2, maxDelayMs);
    }
}
