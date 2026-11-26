import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    tenant: TenantSummary | null;
    flash: Flash;
    [key: string]: unknown;
}

export interface Flash {
    success?: string | null;
    error?: string | null;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    role: 'owner' | 'admin' | 'staff';
    job_title?: string | null;
    is_admin: boolean;
    is_owner: boolean;
    can_manage_settings: boolean;
    can_manage_team: boolean;
    tenant_id: number | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface TenantSummary {
    id: number;
    name: string;
    slug: string;
    currency_code: string;
    invoice_prefix: string;
    logo_path?: string | null;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

export interface Customer {
    id: number;
    name: string;
    company_name?: string | null;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    tax_id?: string | null;
    currency_code?: string | null;
    notes?: string | null;
    is_active: boolean;
    created_at?: string;
    full_address?: string;
    invoices_count?: number;
    billed_total?: number;
    outstanding_balance?: number;
}

export interface Product {
    id: number;
    name: string;
    sku?: string | null;
    description?: string | null;
    unit_price: number;
    unit: string;
    tax_rate_id?: number | null;
    tax_rate?: { id: number; name: string; rate: number } | null;
    is_active: boolean;
}

export interface TaxRate {
    id: number;
    name: string;
    rate: number;
    is_default: boolean;
    is_active?: boolean;
    products_count?: number;
}

export interface PaymentTerm {
    id: number;
    name: string;
    days: number;
    is_default: boolean;
}

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'void' | 'overdue';

export interface InvoiceItem {
    id?: number;
    product_id?: number | null;
    tax_rate_id?: number | null;
    description: string;
    quantity: number;
    unit?: string;
    unit_price: number;
    tax_rate?: number;
    tax_amount?: number;
    line_subtotal?: number;
    line_total?: number;
}

export interface Payment {
    id: number;
    invoice_id?: number;
    invoice_number?: string | null;
    customer_name?: string | null;
    paid_on: string;
    amount: number;
    method?: string;
    method_label?: string;
    reference?: string | null;
    notes?: string | null;
}

export interface Invoice {
    id: number;
    number: string;
    status: string;
    display_status: InvoiceStatus;
    is_overdue: boolean;
    is_editable: boolean;
    issue_date: string;
    due_date: string;
    currency_code: string;
    customer_id?: number | null;
    payment_term_id?: number | null;
    customer_name: string;
    customer_email?: string | null;
    customer_address?: string | null;
    subtotal: number;
    discount_type: 'none' | 'fixed' | 'percent';
    discount_value: number;
    discount_amount: number;
    tax_total: number;
    total: number;
    amount_paid: number;
    balance: number;
    notes?: string | null;
    terms?: string | null;
    footer?: string | null;
    public_token?: string | null;
    share_url?: string | null;
    pdf_url?: string | null;
    sent_at?: string | null;
    paid_at?: string | null;
    items: InvoiceItem[];
    payments: Payment[];
}

export interface InvoiceRow {
    id: number;
    number: string;
    customer_name: string;
    status: InvoiceStatus;
    issue_date: string;
    due_date: string;
    total: number;
    balance: number;
}

export interface MetricSummary {
    count: number;
    total: number;
}

export interface CompanyProfile {
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    tax_id: string | null;
    logo_path: string | null;
    currency_code: string;
    locale: string;
    timezone: string;
    invoice_prefix: string;
    invoice_next_number: number;
    invoice_number_padding: number;
    default_payment_terms_days: number;
    default_tax_rate: string | number;
    invoice_notes: string | null;
    invoice_footer: string | null;
    bank_details: string | null;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: { user: User | null };
    tenant: TenantSummary | null;
    flash: Flash;
};
