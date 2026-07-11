# ERP Smart API Documentation

# توثيق واجهات النظام


# 1. API Principles


All APIs must follow:


- REST architecture.
- Secure authentication.
- Clear responses.
- Proper error handling.
- Permission validation.



---

# 2. Authentication API


## Register User


Endpoint:

POST /api/auth/register


Purpose:

Create a new user account.



Request:


name

email

password



Response:


User created successfully.



---

## Login


Endpoint:


POST /api/auth/login



Purpose:


Authenticate user.



Request:


email

password



Response:


Access token

User information



---

## Logout


Endpoint:


POST /api/auth/logout



Purpose:


End user session.



---

# 3. Company API


## Create Company


Endpoint:


POST /api/companies



Purpose:


Create business account.



Data:


company name

business type

country

currency



---

## Get Company Profile


Endpoint:


GET /api/companies/:id



Purpose:


Retrieve company information.



---

# 4. Customers API


## Create Customer


Endpoint:


POST /api/customers



Data:


name

phone

email

address



---

## Get Customers


Endpoint:


GET /api/customers



Purpose:


Return company customers.



---

## Update Customer


Endpoint:


PUT /api/customers/:id



---

## Delete Customer


Endpoint:


DELETE /api/customers/:id



---

# 5. Products API


## Create Product


Endpoint:


POST /api/products



Data:


name

category

price

quantity



---

## Get Products


Endpoint:


GET /api/products



---

## Update Product


Endpoint:


PUT /api/products/:id



---

## Delete Product


Endpoint:


DELETE /api/products/:id



---

# 6. Inventory API


## Stock Movement


Endpoint:


POST /api/inventory/movement



Purpose:


Record stock changes.



Data:


product_id

type

quantity



Types:


Purchase

Sale

Adjustment



---

# 7. Sales API


## Create Sale


Endpoint:


POST /api/sales



Flow:


Select customer

Add products

Calculate total

Save sale

Update inventory



---

## Get Sales


Endpoint:


GET /api/sales



---

# 8. Invoice API


## Create Invoice


Endpoint:


POST /api/invoices



Purpose:


Generate invoice from sale.



---

## Get Invoice


Endpoint:


GET /api/invoices/:id



---

# 9. Reports API


## Sales Report


Endpoint:


GET /api/reports/sales



Returns:


- Total sales.
- Sales trends.
- Revenue.



---

# 10. API Security Rules


Every API must:


- Verify authentication.
- Check user permissions.
- Validate input.
- Protect company data.
- Return safe errors.



---

# 11. Standard Response Format


Success:


{

status: success,

data: {}

}



Error:


{

status: error,

message: ""

}



---

# API Development Rule


Design first.

Implement second.

Test always.