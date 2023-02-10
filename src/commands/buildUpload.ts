import { build } from "./build";
import { upload } from "./upload";

export const buildUpload = async () => {
  await build();
  await upload();
};
