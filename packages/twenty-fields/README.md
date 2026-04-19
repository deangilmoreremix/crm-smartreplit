# Twenty Fields

A standardized field type definitions and components package for Twenty MF repos.

## Overview

This package provides:

- **Field Type Definitions**: Standardized `FieldMetadataType` enum for all field types
- **Field Utilities**: Helper functions for type checking and field metadata operations
- **Field Components**: Reusable input and display components for different field types
- **Field Definitions**: Utilities for defining and validating field configurations

## Installation

```bash
npm install twenty-fields
# or
yarn add twenty-fields
```

## Usage

### Field Types

```typescript
import { FieldMetadataType } from 'twenty-fields';

const textField: FieldMetadataType = FieldMetadataType.TEXT;
const numberField: FieldMetadataType = FieldMetadataType.NUMBER;
```

### Field Utilities

```typescript
import {
  isFieldMetadataTextKind,
  isFieldMetadataNumericKind,
  isFieldMetadataDateKind,
} from 'twenty-fields';

console.log(isFieldMetadataTextKind(FieldMetadataType.TEXT)); // true
console.log(isFieldMetadataNumericKind(FieldMetadataType.NUMBER)); // true
```

### Field Components

```tsx
import { TextInput, TextDisplay, BooleanInput } from 'twenty-fields';

function MyForm() {
  return (
    <div>
      <TextInput
        instanceId="name-input"
        value="John Doe"
        onChange={(value) => console.log(value)}
      />
      <TextDisplay text="Hello World" />
      <BooleanInput value={true} onToggle={(value) => console.log(value)} />
    </div>
  );
}
```

### Field Definitions

```typescript
import { defineField, FieldMetadataType } from 'twenty-fields';

const fieldConfig = {
  type: FieldMetadataType.TEXT,
  name: 'firstName',
  label: 'First Name',
  objectUniversalIdentifier: 'person',
};

const result = defineField(fieldConfig);

if (result.isValid) {
  console.log('Field defined successfully:', result.config);
} else {
  console.error('Field validation errors:', result.errors);
}
```

## Supported Field Types

- `TEXT` - Plain text fields
- `RICH_TEXT` - Rich text with formatting
- `NUMBER` - Numeric values
- `CURRENCY` - Monetary values
- `BOOLEAN` - True/false values
- `DATE` - Date values
- `DATE_TIME` - Date and time values
- `SELECT` - Single selection from options
- `MULTI_SELECT` - Multiple selections from options
- `EMAILS` - Email addresses
- `PHONES` - Phone numbers
- `ADDRESS` - Address information
- `FILES` - File attachments
- `RELATION` - Relationships to other objects
- `ARRAY` - Array of values
- `RAW_JSON` - JSON data
- `ACTOR` - User/actor references
- `FULL_NAME` - Person's full name
- `LINKS` - URL links
- `RATING` - Numeric rating values
- `TS_VECTOR` - Full-text search vectors
- `UUID` - Universally unique identifiers
- `POSITION` - Position/order values
- `MORPH_RELATION` - Polymorphic relationships

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Contributing

This package is designed to be used across multiple Twenty MF repos. When adding new field types or components, ensure they follow the established patterns and maintain backward compatibility.
