import { ValidationResult, Rule, Validity } from "./types.ts";
import {
  ValidationRules,
  ValidationOptions,
  RawValidationResult,
  InputData,
  InvalidPayload,
} from "./interfaces.ts";
import {
  isOptional,
  isOptionalValue,
  resolveErrorMessages,
  isNullable,
} from "./utils.ts";
import { defaultMessages } from "./messages.ts";

const getValue = (input: InputData, key: string): any => {
  return input[key];
};

export const validateValue = async (
  value: any,
  rules: Rule[],
): Promise<InvalidPayload[]> => {
  if (isOptionalValue(value) && isOptional(rules)) {
    return [];
  }

  if (typeof value === "object" && value === null && isNullable(rules)) {
    return [];
  }

  const results = [];
  for (let rule of rules) {
    let res = rule(value);
    if (res instanceof Promise) {
      res = await res;
    }

    if (res !== undefined) {
      results.push(res);
      if (res.implicit === true) {
        break;
      }
    }
  }
  return results;
};

export const validateData = async (
  input: InputData,
  rules: ValidationRules,
): Promise<RawValidationResult> => {
  const results: RawValidationResult = {};
  for (let key in rules) {
    const keyRules = (rules[key] instanceof Array
      ? rules[key]
      : [rules[key]]) as Rule[];
    const value: any = getValue(input, key);
    const errors: InvalidPayload[] = await validateValue(value, keyRules);
    if (errors.length) {
      results[key] = errors;
    }
  }
  return results;
};

export const validate = async (
  input: InputData,
  rules: ValidationRules,
  options: ValidationOptions = {
    messages: defaultMessages,
  },
): Promise<ValidationResult> => {
  const rawErrors = await validateData(input, rules);
  const passes = Object.keys(rawErrors).length === 0;

  const errors = passes ? {} : resolveErrorMessages(rawErrors, options);

  return [passes, errors];
};
