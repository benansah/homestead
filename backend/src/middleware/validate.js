export const validate = (schema) => (req, res, next) => {
  const result = schema?.safeParse ? schema.safeParse(req.body) : { success: true, data: req.body };
  if (!result.success) {
    // Zod may expose errors under `errors` or `issues` depending on version/shape.
    const rawErrors = result.error?.errors ?? result.error?.issues ?? [];
    const errors = Array.isArray(rawErrors)
      ? rawErrors.map((e) => ({
          field:   Array.isArray(e.path) ? e.path.join('.') : (e.path ?? '').toString(),
          message: e.message ?? String(e),
        }))
      : [];
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  req.body = result.data;
  next();
};