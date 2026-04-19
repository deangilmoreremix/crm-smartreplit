import { FieldMetadataType } from '../types/FieldMetadataType';

export interface FieldManifest {
  type: FieldMetadataType;
  name: string;
  label: string;
  description?: string;
  icon?: string;
  defaultValue?: any;
  options?: any;
  isNullable?: boolean;
  objectUniversalIdentifier: string;
}

export interface DefineFieldResult {
  config: FieldManifest;
  errors: string[];
  isValid: boolean;
}

export const defineField = (config: FieldManifest): DefineFieldResult => {
  const errors: string[] = [];

  if (!config.objectUniversalIdentifier) {
    errors.push('Field must have an objectUniversalIdentifier');
  }

  if (!config.name) {
    errors.push('Field must have a name');
  }

  if (!config.label) {
    errors.push('Field must have a label');
  }

  if (!config.type) {
    errors.push('Field must have a type');
  }

  return {
    config,
    errors,
    isValid: errors.length === 0,
  };
};
