# API reference

All endpoints are under `/api/v1`. Send JSON with `Content-Type: application/json`; authenticated routes require a bearer token from registration or login. Registration requires a 12-character password. Resource list and create routes are available for customers, products, orders, payments, inventory, employees and operations. Create operations require owner, admin or manager. `/analytics` returns counts by resource. `/assistant` accepts `{ "question": "..." }` and returns a locally generated, clearly labeled suggestion. List results are capped at 250 records.

Validation errors return HTTP 400 with `VALIDATION_ERROR`; unauthenticated and role-denied requests return 401 and 403. Every server error has a request ID, also available in `X-Request-Id`.
