# ERP Smart Wireframes

# مخططات واجهات المستخدم


# 1. General Layout

## التخطيط العام للتطبيق


All screens use the same structure:


Desktop:

--------------------------------

Header:
- Logo
- Search
- Notifications
- User profile


Sidebar:
- Dashboard
- Customers
- Products
- Inventory
- Sales
- Invoices
- Reports
- Settings


Main Content:
Application pages


--------------------------------



Mobile:

- Top bar
- Main content
- Bottom navigation



---

# 2. Login Screen

## شاشة تسجيل الدخول


Purpose:

Allow users to securely access their accounts.


Layout:


Logo

Welcome message


Input fields:

- Email
- Password


Buttons:

- Login
- Forgot password


Additional:

- Create account



User Flow:


User enters information

↓

Validation

↓

Login

↓

Dashboard



---

# 3. Company Setup Screen

## إنشاء الشركة


Purpose:

Create company profile after registration.


Fields:

- Company name
- Business type
- Country
- Currency


Button:

Create Company



After completion:

Go to Dashboard



---

# 4. Dashboard Screen

## لوحة التحكم


Purpose:

Give business owner quick understanding of business status.


Layout:


Top Summary Cards:


Card 1:

Today's Sales


Card 2:

Revenue


Card 3:

Products Count


Card 4:

Low Stock Alerts



Middle Section:


Sales Chart

Shows:

- Daily sales
- Weekly sales
- Monthly sales



Bottom Section:


Recent Sales

Recent Customers

Important Alerts



Future AI Section:


AI Business Assistant:


Example:

"Your sales decreased 15% this week."

"Product X needs restocking."



---

# 5. Products Screen

## شاشة المنتجات


Purpose:

Manage products.


Layout:


Top:

Search bar

Filter button

Add Product button



Table:


Product Name

Category

Price

Quantity

Status

Actions



Actions:

- Edit
- Delete
- View



---

# 6. Add Product Screen


Fields:


Product name

Category

Purchase price

Selling price

Quantity

Barcode


Button:

Save Product



Validation:

- Name required
- Price must be valid
- Quantity cannot be negative



---

# 7. Customers Screen


Purpose:

Manage customer relationships.


Contains:


Search

Add customer button


Customer list:


Name

Phone

Email

Total purchases

Actions



---

# 8. Sales Screen


Purpose:

Create and manage sales.


Flow:


Select customer

↓

Add products

↓

Calculate total

↓

Choose payment method

↓

Complete sale


After completion:

- Update inventory
- Create invoice



---

# 9. Invoice Screen


Contains:


Invoice number

Customer information

Products

Quantity

Total


Actions:


- Print
- Download
- Share



---

# 10. Reports Screen


Contains:


Sales report

Inventory report

Revenue summary



Charts:

- Sales trends
- Best products



---

# Design Rules


All screens must:


- Be simple.
- Use consistent components.
- Require minimum clicks.
- Work on mobile.
- Support Arabic and English.