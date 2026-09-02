import { readFileSync } from 'node:fs';
import { z } from 'zod';

const packageJsonSchema = z.object({ version: z.string() });

// src/utils/ and build/utils/ are both two levels below the package root.
const packageJsonUrl = new URL('../../package.json', import.meta.url);

export const packageVersion: string = packageJsonSchema.parse(
  JSON.parse(readFileSync(packageJsonUrl, 'utf8'))
).version;
