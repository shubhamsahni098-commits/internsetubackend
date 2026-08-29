import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

// Pass a zod schema shaped like { body: z.object({...}) } (or query/params)
// and this validates + strips unknown fields before the controller runs.
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
            const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body ?? req.body;
      // req.query/req.params are getter-only in some Express setups, so mutate
      // in place rather than reassigning - this keeps the *coerced* types
      // (e.g. limit: "3" -> 3) actually reaching the controller.
      if (parsed.query) Object.assign(req.query, parsed.query);
      if (parsed.params) Object.assign(req.params, parsed.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          ApiError.badRequest(
            "Validation failed",
            err.errors.map((e) => ({ path: e.path.join("."), message: e.message }))
          )
        );
      }
      next(err);
    }
  };
}
