## Table `attendance`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `student_id` | `text` |  Nullable |
| `class_id` | `text` |  Nullable |
| `timestamp` | `timestamptz` |  |
| `date` | `date` |  Nullable |

## Table `bins`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `class_id` | `text` |  |
| `location` | `text` |  Nullable |
| `fill_level` | `int4` |  Nullable |
| `last_updated` | `timestamptz` |  Nullable |

## Table `commands`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `command_type` | `text` |  |
| `class_id` | `text` |  |
| `status` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `school_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `created_at` | `timestamptz` |  |
| `action_type` | `text` |  Nullable |
| `temperature` | `float4` |  Nullable |
| `class_id` | `text` |  Nullable |

## Table `students`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `student_id` | `text` | Primary |
| `name` | `text` |  |
| `role` | `text` |  Nullable |
| `class_id` | `text` |  Nullable |

## Table `tasks`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `title` | `text` |  |
| `status` | `bool` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `users`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `username` | `text` |  Unique |
| `password_hash` | `text` |  |
| `role` | `text` |  |
| `class_id` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

