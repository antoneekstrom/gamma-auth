import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { Strategy } from "passport-strategy";
import { ParsedQs } from "qs";

export class GammaStrategy extends Strategy {
  authenticate(
    req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
    options?: any
  ): void {}
}
