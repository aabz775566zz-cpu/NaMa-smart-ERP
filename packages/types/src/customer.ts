/** Matches CustomersService — GET/POST/PATCH /customers, /customers/:id */
export interface Customer {
  id: string;
  companyId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
