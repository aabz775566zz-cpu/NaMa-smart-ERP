# ERP Smart Database Design

# تصميم قاعدة البيانات


## فكرة عامة

قاعدة البيانات هي المكان الذي يخزن فيه النظام جميع معلومات الشركات والمستخدمين والعمليات.


---

# 1. Users Table

## جدول المستخدمين

يخزن بيانات الأشخاص الذين يستخدمون النظام.


Fields:

- id
- full_name
- email
- password
- phone
- avatar
- created_at


Example:

User:
Ahmed

Email:
ahmed@example.com


---

# 2. Companies Table

## جدول الشركات

كل حساب يمثل شركة داخل النظام.


Fields:

- id
- company_name
- industry_type
- country
- currency
- owner_id
- created_at


Example:

Company:
ABC Store

Type:
Retail


---

# 3. User Roles Table

## الصلاحيات


لتحديد ماذا يستطيع كل مستخدم فعله.


Roles:

- Owner
- Manager
- Employee
- Accountant


Fields:

- id
- user_id
- company_id
- role


---

# 4. Customers Table

## العملاء


يحفظ بيانات العملاء.


Fields:

- id
- company_id
- name
- phone
- email
- address
- notes
- created_at


---

# 5. Products Table

## المنتجات


يحفظ المنتجات والخدمات.


Fields:

- id
- company_id
- name
- description
- category
- purchase_price
- selling_price
- quantity
- image
- created_at


---

# 6. Inventory Table

## المخزون


يتابع حركة المنتجات.


Fields:

- id
- product_id
- quantity_change
- movement_type
- created_at


Movement Types:

- Add
- Sale
- Return


---

# 7. Sales Table

## المبيعات


يحفظ عمليات البيع.


Fields:

- id
- company_id
- customer_id
- total_amount
- payment_method
- created_at


---

# 8. Sale Items Table

## تفاصيل المبيعات


كل فاتورة تحتوي على منتجات.


Fields:

- id
- sale_id
- product_id
- quantity
- price


---

# 9. Invoices Table

## الفواتير


Fields:

- id
- sale_id
- invoice_number
- status
- created_at


Status:

- Paid
- Pending
- Cancelled


---

# 10. Expenses Table

## المصروفات


Fields:

- id
- company_id
- title
- amount
- category
- date


---

# 11. Subscriptions Table

## الاشتراكات


لأن النظام SaaS.


Fields:

- id
- company_id
- plan
- start_date
- end_date
- status


Plans:

- Free
- Basic
- Pro


---

# 12. Notifications Table

## الإشعارات


Fields:

- id
- user_id
- title
- message
- read_status
- created_at


---

# Database Relationships


User

↓

Company

↓

Products

↓

Sales

↓

Invoices


Company owns:

- Users
- Customers
- Products
- Sales
- Expenses


---

# Future AI Tables

جداول مستقبلية للذكاء الاصطناعي:


- AI conversations
- Business insights
- Recommendations
- Predictions