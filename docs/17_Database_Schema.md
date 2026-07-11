# ERP Smart Database Schema

# تصميم قاعدة البيانات


# 1. Database Architecture

## بنية قاعدة البيانات


ERP Smart is a multi-tenant SaaS system.


Meaning:

Each company has isolated data.


Structure:


Platform

↓

Companies

↓

Users

↓

Business Data



---

# 2. Main Database Tables


## Users Table

Purpose:

Store system users.


Fields:


id

- Unique identifier


name

- User full name


email

- Login email


password_hash

- Encrypted password


role_id

- User permission role


company_id

- Connected company


created_at

- Creation date


updated_at

- Last update date



---

# Companies Table


Purpose:

Store business accounts.


Fields:


id

name

business_type

country

currency

logo

subscription_plan

created_at

updated_at



---

# Roles Table


Purpose:

Control permissions.


Fields:


id

name


Examples:


Owner

Manager

Employee

Accountant



---

# Permissions Table


Purpose:

Define allowed actions.


Fields:


id

role_id

module

action



Example:


Module:

Products


Action:

Create

Edit

Delete

View



---

# Customers Table


Purpose:

Store customer information.


Fields:


id

company_id

name

phone

email

address

notes

created_at



---

# Products Table


Purpose:

Store products.


Fields:


id

company_id

name

category_id

barcode

purchase_price

selling_price

quantity

status

created_at



---

# Categories Table


Purpose:

Organize products.


Fields:


id

company_id

name



---

# Inventory Movements Table


Purpose:

Track every stock change.


Fields:


id

company_id

product_id

type

quantity

reference

created_at



Types:


Purchase

Sale

Adjustment



---

# Sales Table


Purpose:

Store sales transactions.


Fields:


id

company_id

customer_id

user_id

total_amount

payment_method

status

created_at



---

# Sale Items Table


Purpose:

Store products inside each sale.


Fields:


id

sale_id

product_id

quantity

price



---

# Invoices Table


Purpose:

Store invoices.


Fields:


id

company_id

sale_id

invoice_number

total

status

created_at



---

# Subscriptions Table


Purpose:

Manage SaaS plans.


Fields:


id

company_id

plan_name

start_date

end_date

status



---

# AI Insights Table


Purpose:

Store AI recommendations.


Fields:


id

company_id

type

message

created_at



Examples:


Low stock warning.


Sales prediction.


Business recommendation.



---

# 3. Database Relationships


Company

has many:

- Users
- Customers
- Products
- Sales
- Invoices



User

belongs to:

- Company
- Role



Product

belongs to:

- Category
- Company



Sale

contains:

- Customer
- Products
- Invoice



---

# 4. Multi Tenant Rules


Every business table must include:


company_id


Example:


Products:

Company A products

cannot appear for Company B.



---

# 5. Database Security Rules


Must support:


- Data isolation.
- Access control.
- Backup.
- Encryption.
- Validation.



---

# 6. Future Expansion


Database should allow adding:


- Accounting.
- Payroll.
- CRM.
- Manufacturing.
- Automation.
- Advanced AI.



---

# Database Design Principle


Simple enough for MVP.

Powerful enough for future growth.