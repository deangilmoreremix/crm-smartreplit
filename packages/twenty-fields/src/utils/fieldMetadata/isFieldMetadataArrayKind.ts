import { FieldMetadataType } from '../types/FieldMetadataType';

export const isFieldMetadataArrayKind = (fieldMetadataType: FieldMetadataType): boolean => {
  return (
    fieldMetadataType === FieldMetadataType.MULTI_SELECT ||
    fieldMetadataType === FieldMetadataType.ARRAY
  );
};
