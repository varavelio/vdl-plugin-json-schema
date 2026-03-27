import { definePlugin } from "@varavel/vdl-plugin-sdk";
import { generateFunc } from "./json-schema.js";

export const generate = definePlugin((input) => {
  return generateFunc(input);
});
