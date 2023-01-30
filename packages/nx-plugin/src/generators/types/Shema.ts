import { Linter } from '@nrwl/linter';

import { GeneratorType } from './GeneratorType';

export interface Schema {
  name: string;
  directory: string;
}

export interface NormalizedSchema extends Schema {
  projectClassName: string;
  projectPropertyName: string;
  hashedProjectName: string;
  generatorType: GeneratorType;
  importPath: string;
  linter: Linter;
  name: string;
  offsetFromRoot: string;
  packageRoot: string;
  workspaceName: string;
}
