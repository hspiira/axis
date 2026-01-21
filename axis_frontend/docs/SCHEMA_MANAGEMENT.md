# Schema Management Best Practices

Comprehensive guide for managing Zod validation schemas in the Axis project, following Zod v4 best practices.

## Table of Contents

1. [Philosophy](#philosophy)
2. [Directory Structure](#directory-structure)
3. [Schema Organization](#schema-organization)
4. [Reusable Utilities](#reusable-utilities)
5. [Type Safety](#type-safety)
6. [Common Patterns](#common-patterns)
7. [Backend Alignment](#backend-alignment)
8. [Testing](#testing)

---

## Philosophy

### Core Principles

1. **Single Source of Truth**: One schema per entity, centrally located
2. **Type Inference**: Let Zod generate TypeScript types automatically
3. **Reusability**: Share common validation logic across entities
4. **Backend Alignment**: Match Django model constraints exactly
5. **Composability**: Build complex schemas from simple primitives

### Zod v4 Best Practices

```typescript
// ✅ GOOD: Modern Zod pattern
const schema = z.string().trim().transform((val) => (val === '' ? undefined : val)).optional()

// ❌ BAD: Old pattern with unnecessary complexity
const schema = z.string().optional().or(z.literal('')).transform((val) => (val === '' ? undefined : val))
```

**Key Updates from Zod v4:**
- Use `.pipe()` for chained transformations
- Use `.default()` for default values
- Use `.nullish()` for both null and undefined
- Prefer spread syntax (`...schema.shape`) over `.extend()`

---

## Directory Structure

```
src/
├── schemas/
│   ├── index.ts                 # Barrel export
│   ├── utils.ts                 # Reusable schema utilities
│   ├── client.schema.ts         # Client entity schemas
│   ├── contract.schema.ts       # Contract entity schemas (future)
│   ├── case.schema.ts           # Case entity schemas (future)
│   └── staff.schema.ts          # Staff entity schemas (future)
```

### File Naming Convention

- **Entity Schemas**: `{entity}.schema.ts`
- **Utilities**: `utils.ts`
- **Barrel Export**: `index.ts`

---

## Schema Organization

### Entity Schema Structure

Each entity schema file should contain:

```typescript
/**
 * Entity Validation Schemas
 *
 * @see Backend model path for reference
 */

import { z } from 'zod'
import { requiredTextField, optionalEmail, /* ... */ } from './utils'

// 1. Form schema (create/update)
export const entityFormSchema = z.object({
  // fields...
}).refine(/* custom validations */)

// 2. Inferred TypeScript type
export type EntityFormValues = z.infer<typeof entityFormSchema>

// 3. Search/filter schema
export const entitySearchSchema = z.object({
  // fields...
})

export type EntitySearchValues = z.infer<typeof entitySearchSchema>

// 4. ID validation schema
export const entityIdSchema = z.string().length(25, 'Invalid ID')

// 5. Additional operation schemas (bulk actions, etc.)
export const bulkEntityOperationSchema = z.object({
  // fields...
})
```

### Example: Client Schema

```typescript
// src/schemas/client.schema.ts
export const clientFormSchema = z
  .object({
    name: requiredTextField(255, 'Client name'),
    email: optionalEmail,
    phone: optionalPhone,
    // ... more fields
  })
  .refine(
    requireAtLeastOne(['email', 'phone', 'contact_email', 'contact_phone']),
    {
      message: 'At least one contact method is required',
      path: ['email'],
    }
  )

export type ClientFormValues = z.infer<typeof clientFormSchema>
```

---

## Reusable Utilities

### Available Utilities (`src/schemas/utils.ts`)

#### Basic Field Types

```typescript
// Optional fields (empty strings become undefined)
import {
  optionalString,
  optionalEmail,
  optionalUrl,
  optionalPhone,
  optionalTextarea,
  optionalTimezone,
} from '@/schemas'

// Required fields
import {
  requiredEmail,
  requiredUrl,
  textField,           // textField(255, 'Field name')
  requiredTextField,   // requiredTextField(255, 'Field name')
  optionalTextField,   // optionalTextField(255, 'Field name')
} from '@/schemas'
```

#### Specialized Types

```typescript
// Database identifiers
import { cuid, optionalCuid } from '@/schemas'

// Timestamps
import { datetime, optionalDatetime } from '@/schemas'

// Timezone validation
import { timezone, optionalTimezone } from '@/schemas'

// JSON metadata
import { metadata } from '@/schemas'
```

#### Validation Helpers

```typescript
// Require at least one field
import { requireAtLeastOne } from '@/schemas'

const schema = z.object({
  email: optionalEmail,
  phone: optionalPhone,
}).refine(
  requireAtLeastOne(['email', 'phone'], 'At least one contact method required'),
  { path: ['email'] }
)

// Conditionally required fields
import { conditionallyRequired } from '@/schemas'

const schema = z.object({
  hasAddress: z.boolean(),
  address: optionalString,
}).refine(
  conditionallyRequired(
    (data) => data.hasAddress,
    'address',
    'Address is required when hasAddress is true'
  ),
  { path: ['address'] }
)
```

### Creating New Utilities

When creating new reusable utilities, follow this pattern:

```typescript
/**
 * Brief description
 *
 * @param param - Parameter description
 * @returns Schema description
 */
export function utilityName(param: Type) {
  return z
    .string()
    .trim()
    .transform(/* transformation logic */)
    .pipe(/* additional validations */)
    .optional()
}
```

---

## Type Safety

### Type Inference

**Always use `z.infer`** to generate TypeScript types from schemas:

```typescript
// ✅ GOOD: Type inferred from schema
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
})

type User = z.infer<typeof userSchema>

// ❌ BAD: Manual type definition (can drift from schema)
interface User {
  name: string
  age: number
}
```

### Form Integration

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clientFormSchema, type ClientFormValues } from '@/schemas'

// Type-safe form with automatic validation
const form = useForm<ClientFormValues>({
  resolver: zodResolver(clientFormSchema),
  defaultValues: { /* ... */ },
})
```

### API Type Compatibility

Schema types may need to be cast to API types:

```typescript
const onSubmit = async (data: ClientFormValues) => {
  // Schema automatically transforms data
  await createClient(data as ClientFormData)
}
```

---

## Common Patterns

### 1. Optional Fields with Empty String Handling

```typescript
// Transforms empty strings to undefined
const optionalField = z
  .string()
  .trim()
  .transform((val) => (val === '' ? undefined : val))
  .optional()
```

### 2. Email Validation

```typescript
// Optional email
const optionalEmail = z
  .string()
  .trim()
  .transform((val) => (val === '' ? undefined : val))
  .pipe(z.string().email('Invalid email').optional())

// Required email
const requiredEmail = z.string().trim().email('Invalid email')
```

### 3. Max Length Fields

```typescript
// Match Django CharField(max_length=255)
const name = requiredTextField(255, 'Name')

// Optional with max length
const taxId = optionalTextField(50, 'Tax ID')
```

### 4. Enum Validation

```typescript
export enum BaseStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

const schema = z.object({
  status: z.nativeEnum(BaseStatus).default(BaseStatus.ACTIVE),
  optionalStatus: z.nativeEnum(BaseStatus).optional(),
})
```

### 5. Custom Refinements

```typescript
const schema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })
```

### 6. Dependent Fields

```typescript
const schema = z
  .object({
    country: z.string(),
    state: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.country === 'US') {
        return !!data.state
      }
      return true
    },
    {
      message: 'State is required for US addresses',
      path: ['state'],
    }
  )
```

---

## Backend Alignment

### Verification Process

1. **Find the Django Migration**: Locate the latest migration file for the entity
   ```
   axis_backend/apps/{app}/migrations/0001_initial.py
   ```

2. **Map Field Types**:

   | Django Field | Zod Schema |
   |--------------|------------|
   | `CharField(max_length=N)` | `requiredTextField(N)` or `optionalTextField(N)` |
   | `EmailField()` | `optionalEmail` or `requiredEmail` |
   | `URLField()` | `optionalUrl` or `requiredUrl` |
   | `TextField()` | `optionalTextarea` or `textarea` |
   | `BooleanField()` | `z.boolean()` |
   | `IntegerField()` | `z.number().int()` |
   | `DecimalField()` | `z.number()` |
   | `DateTimeField()` | `datetime` or `optionalDatetime` |
   | `JSONField()` | `metadata` |
   | `ForeignKey()` | `cuid` or `optionalCuid` |

3. **Match Constraints**:
   ```python
   # Django
   name = models.CharField(max_length=255, blank=False)
   email = models.EmailField(blank=True, null=True)
   ```

   ```typescript
   // Zod
   name: requiredTextField(255, 'Name'),
   email: optionalEmail,
   ```

4. **Handle Defaults**:
   ```python
   # Django
   status = models.CharField(default='Active')
   is_verified = models.BooleanField(default=False)
   ```

   ```typescript
   // Zod
   status: z.nativeEnum(BaseStatus).default(BaseStatus.ACTIVE),
   is_verified: z.boolean().default(false),
   ```

### Example: Client Schema Alignment

**Django Model** (`axis_backend/apps/clients/migrations/0001_initial.py:102-285`):
```python
fields=[
    ("name", models.CharField(max_length=255, help_text="Legal or operating name")),
    ("email", models.EmailField(blank=True, null=True)),
    ("phone", models.CharField(max_length=20, blank=True, null=True)),
    # ...
]
```

**Zod Schema** (`src/schemas/client.schema.ts`):
```typescript
export const clientFormSchema = z.object({
  name: requiredTextField(255, 'Client name'),
  email: optionalEmail,
  phone: optionalPhone,  // max 20 chars
  // ...
})
```

---

## Testing

### Schema Validation Testing

```typescript
import { describe, it, expect } from 'vitest'
import { clientFormSchema } from '@/schemas'

describe('clientFormSchema', () => {
  it('should accept valid client data', () => {
    const result = clientFormSchema.safeParse({
      name: 'Acme Corp',
      email: 'contact@acme.com',
      status: 'Active',
    })

    expect(result.success).toBe(true)
  })

  it('should require at least one contact method', () => {
    const result = clientFormSchema.safeParse({
      name: 'Acme Corp',
      // no email, phone, or contact info
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('contact method')
    }
  })

  it('should transform empty strings to undefined', () => {
    const result = clientFormSchema.parse({
      name: 'Acme Corp',
      email: 'test@test.com',
      phone: '',  // empty string
    })

    expect(result.phone).toBeUndefined()
  })

  it('should trim whitespace', () => {
    const result = clientFormSchema.parse({
      name: '  Acme Corp  ',
      email: '  test@test.com  ',
    })

    expect(result.name).toBe('Acme Corp')
    expect(result.email).toBe('test@test.com')
  })
})
```

### Form Integration Testing

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientForm } from '@/components/clients/ClientForm'

it('should show validation errors', async () => {
  const user = userEvent.setup()
  render(<ClientForm onSubmit={vi.fn()} onCancel={vi.fn()} />)

  // Submit without filling required fields
  await user.click(screen.getByText('Submit'))

  // Should show validation error
  expect(screen.getByText('Client name is required')).toBeInTheDocument()
})
```

---

## Migration Guide

### Migrating Existing Forms

1. **Create Entity Schema**:
   ```typescript
   // src/schemas/entity.schema.ts
   export const entityFormSchema = z.object({
     // Define fields based on backend model
   })

   export type EntityFormValues = z.infer<typeof entityFormSchema>
   ```

2. **Update Form Component**:
   ```typescript
   // Before
   import { z } from 'zod'
   const schema = z.object({ /* inline schema */ })

   // After
   import { entityFormSchema, type EntityFormValues } from '@/schemas'
   ```

3. **Update Form Hook**:
   ```typescript
   // Before
   const form = useForm<EntityFormData>({
     resolver: zodResolver(localSchema),
   })

   // After
   const form = useForm<EntityFormValues>({
     resolver: zodResolver(entityFormSchema),
   })
   ```

4. **Remove Manual Transformations**:
   ```typescript
   // Before: Manual transformation
   const onSubmit = (data) => {
     const cleaned = {
       ...data,
       email: data.email?.trim() || undefined,
       phone: data.phone?.trim() || undefined,
     }
     await createEntity(cleaned)
   }

   // After: Schema handles transformations
   const onSubmit = async (data: EntityFormValues) => {
     await createEntity(data as EntityFormData)
   }
   ```

---

## Best Practices Checklist

- [ ] One schema file per entity
- [ ] Use reusable utilities from `src/schemas/utils.ts`
- [ ] Infer types with `z.infer<typeof schema>`
- [ ] Match backend field constraints exactly
- [ ] Add JSDoc comments with backend model reference
- [ ] Use `.default()` for default values
- [ ] Use `.trim()` for all string fields
- [ ] Transform empty strings to `undefined` for optional fields
- [ ] Export both schema and inferred type
- [ ] Add schemas to barrel export (`src/schemas/index.ts`)
- [ ] Write tests for custom validations
- [ ] Document complex refinements

---

## Resources

- [Zod Official Documentation](https://zod.dev/)
- [React Hook Form + Zod Integration](https://react-hook-form.com/get-started#SchemaValidation)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- Backend Models: `/Users/piira/dev/axis/axis_backend/apps/{app}/migrations/`

---

## FAQ

**Q: Why use schemas instead of TypeScript interfaces?**
A: Schemas provide runtime validation, automatic type inference, and ensure data integrity at the system boundary.

**Q: When should I create a new utility function?**
A: When you use the same validation pattern in 3+ schemas, extract it to `utils.ts`.

**Q: How do I handle nullable vs. optional fields?**
A: Use `.optional()` for `undefined`, `.nullable()` for `null`, `.nullish()` for both. Match your backend model.

**Q: Can I use schemas for API responses?**
A: Yes! Create separate response schemas and use `.parse()` to validate API data.

**Q: How do I debug schema validation errors?**
A: Use `.safeParse()` instead of `.parse()` to get detailed error information without throwing.

```typescript
const result = schema.safeParse(data)
if (!result.success) {
  console.log(result.error.issues)
}
```
