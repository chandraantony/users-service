

## Usage Instructions

### Debugging

1. First, run the SQL files in `src/database/procedures/*.sql`.
2. Then run debugging with `npm run start`.

### Production

1. Run `npm run build` — the SQL files will be automatically generated and executed at start time.
2. Then run `npm run start:prod`.
---

# Entity Relationships Overview

Based on the provided TypeORM entity definitions, here's a clear description of the relationships between the **User**, **Role**, and **Address** entities.

---

## 1. User ↔ Role (Many-to-Many)

- A **User** can have **multiple Roles**.
- A **Role** can be assigned to **multiple Users**.
- Implemented using a **join table** named `user_roles`:
  - `user_id` → references `id` in the `users` table
  - `role_id` → references `id` in the `roles` table
- **Eager loading** is enabled on the `User` side (`roles` are automatically fetched when a user is retrieved).
- On the `Role` side, the relationship is **not eager** (users are not automatically loaded with a role unless explicitly requested).

> **Example**: A user might have roles like `admin`, `editor`, and `viewer`. Conversely, the `admin` role might be assigned to multiple users.

---

## 2. User ↔ Address (One-to-One)

- Each **User** has **exactly one Address**.
- Each **Address** belongs to **exactly one User**.
- The relationship is **bidirectional**:
  - From `User` → access `Address` via the `address` property.
  - From `Address` → access `User` via the `user` property.
- The foreign key (`address_id`) is stored in the **`users` table**, referencing `id` in the `addresses` table.
- **Cascade: true** → saving or removing a `User` automatically persists or removes the associated `Address`.
- **Eager loading** is enabled on the `User` side (`address` is fetched automatically with the user).

> **Example**: When you load a user, their full address (street, city, postal code) is included without an additional query.

---

## Relationship Summary Table

| Entity    | Relationship Type | Related Entity | Eager? | Cascade? | Join / Foreign Key Location        |
|-----------|-------------------|----------------|--------|----------|------------------------------------|
| `User`    | Many-to-Many      | `Role`         | ✅ Yes | ❌ No    | Join table: `user_roles`           |
| `User`    | One-to-One        | `Address`      | ✅ Yes | ✅ Yes   | FK in `users` table (`address_id`) |
| `Role`    | Many-to-Many      | `User`         | ❌ No  | ❌ No    | Same join table (`user_roles`)     |
| `Address` | One-to-One        | `User`         | ❌ No  | ❌ No    | Inverse side (FK in `users`)       |

---
