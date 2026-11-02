# Security Specification for FarmConnect

## 1. Data Invariants
- An order MUST contain a valid `farmerId`.
- An order MUST belong to the `customerId` who placed it.
- A product MUST be owned by the `farmerId`.
- Users can only read their own profile, messages, and notifications.
- Farmers can only update order statuses for orders assigned to them.
- Only Admin can configure delivery pricing.

## 2. Dirty Dozen Payloads (Targeted tests to fail)
1. `spoof_farmer_id`: Creating an order with a `farmerId` that doesn't match the product.
2. `spoof_customer_id`: Creating an order with a `customerId` that doesn't match `request.auth.uid`.
3. `unauthorized_order_read`: Farmer A attempting to read Farmer B's orders.
4. `unauthorized_order_update`: Farmer A attempting to update an order belonging to Farmer B.
5. `inject_junk_id`: Sending a 1KB junk string as `orderId`.
6. `spoof_admin_role`: Trying to write to `admin_settings` collection without admin role.
7. `modify_immutable_field`: Updating `orderNumber` or `createdAt` of an existing order.
8. `negative_delivery_charge`: Setting delivery charge to -50.
9. `inject_ghost_field`: Adding `isAdmin: true` to a user profile update.
10. `read_pii_spoof`: Attempting to read another user's PII via `users/{userId}`.
11. `query_all_orders`: `allow list` without restricting `resource.data.farmerId` or `customerId`.
12. `update_terminal_status`: Updating a `delivered` order to `pending`.

## 3. Implementation Plan
- Define `isSignedIn`, `isAdmin`, `isOwner`, `isFarmerAssigned` helpers.
- Apply strictly to `orders`, `products`, `users`, `farmers` collections.
