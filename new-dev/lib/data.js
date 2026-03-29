import { readFileSync } from 'fs';
import { load } from 'js-yaml';

export const { categories } = load(readFileSync('./data.yml', 'utf8'));
