import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Check, FileText, Layers, LineChart, ShieldCheck } from 'lucide-react';

export default function Welcome() {
    return (
        <>
            <Head title="Multi-company invoicing" />
            <div className="bg-canvas text-ink min-h-svh">
                <header className="border-hairline bg-canvas/90 sticky top-0 z-40 border-b backdrop-blur">
                    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
                        <Link href="/" className="flex items-center gap-2.5">
                            <span className="bg-ink flex h-7 w-7 items-center justify-center rounded-md text-white">
                                <AppLogoIcon className="size-3.5 fill-current" />
                            </span>
                            <span className="text-[13px] font-medium tracking-tight">Simple Invoices</span>
                        </Link>
                        <nav className="text-ink-muted hidden items-center gap-7 text-[13px] md:flex">
                            <a href="#product" className="hover:text-ink">
                                Product
                            </a>
                            <a href="#features" className="hover:text-ink">
                                Features
                            </a>
                            <a href="#tenancy" className="hover:text-ink">
                                Multi-company
                            </a>
                        </nav>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" asChild className="text-ink hover:bg-surface-2 text-[13px]">
                                <Link href={route('login')}>Log in</Link>
                            </Button>
                            <Button asChild className="bg-ink hover:bg-ink/90 h-9 px-4 text-[13px] text-white">
                                <Link href={route('register')}>Start free</Link>
                            </Button>
                        </div>
                    </div>
                </header>

                <main>
                    <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28">
                        <div className="max-w-3xl">
                            <p className="text-ink-subtle text-[13px] font-medium">Invoicing for modern studios and agencies</p>
                            <h1 className="text-display text-ink mt-5 text-[44px] sm:text-[64px] md:text-[72px]">
                                Send invoices that feel as considered as your work.
                            </h1>
                            <p className="text-ink-muted mt-6 max-w-xl text-lg leading-relaxed">
                                Simple Invoices is a multi-company billing workspace. Every company gets isolated customers, numbered invoices,
                                payment tracking and reporting — on a calm, editorial surface.
                            </p>
                            <div className="mt-9 flex flex-wrap items-center gap-3">
                                <Button asChild className="bg-ink hover:bg-ink/90 h-11 rounded-md px-6 text-[15px] text-white">
                                    <Link href={route('register')}>
                                        Create your workspace <ArrowRight className="ml-1 h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="border-hairline bg-surface text-ink hover:bg-surface-2 h-11 rounded-md px-6 text-[15px]"
                                >
                                    <Link href={route('login')}>Explore the demo</Link>
                                </Button>
                            </div>
                            <p className="text-ink-subtle mt-4 text-xs">Demo tenant: demo@simpleinvoices.test · password</p>
                        </div>

                        <div id="product" className="border-hairline bg-surface mt-16 rounded-2xl border p-3">
                            <div className="border-hairline-soft bg-canvas rounded-xl border p-5">
                                <div className="border-hairline flex items-center justify-between border-b pb-4">
                                    <div>
                                        <p className="text-ink-subtle text-[11px] tracking-[0.08em] uppercase">Acme Studio · Workspace</p>
                                        <p className="text-ink mt-1 text-lg font-medium tracking-tight">Invoices</p>
                                    </div>
                                    <span className="bg-ink rounded-md px-3 py-1.5 text-xs text-white">New invoice</span>
                                </div>
                                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                    {[
                                        { label: 'Outstanding', value: '$18,400', hint: '3 invoices' },
                                        { label: 'Collected this month', value: '$9,250', hint: '4 payments' },
                                        { label: 'Overdue', value: '$2,200', hint: '1 invoice' },
                                    ].map((card) => (
                                        <div key={card.label} className="border-hairline bg-surface rounded-lg border p-4">
                                            <p className="text-ink-subtle text-[11px]">{card.label}</p>
                                            <p className="text-ink mt-2 text-xl font-medium tracking-tight">{card.value}</p>
                                            <p className="text-ink-muted text-[11px]">{card.hint}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-hairline bg-surface mt-3 overflow-hidden rounded-lg border">
                                    {[
                                        ['ACM-0042', 'Lumen Health', 'Paid', '$4,800.00'],
                                        ['ACM-0041', 'Orbit Freight', 'Partially paid', '$9,500.00'],
                                        ['ACM-0040', 'Studio Rossi', 'Overdue', '$2,200.00'],
                                    ].map((row) => (
                                        <div
                                            key={row[0]}
                                            className="border-hairline-soft flex items-center justify-between border-b px-4 py-3 text-sm last:border-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="text-ink-subtle h-4 w-4" />
                                                <span className="text-ink font-medium">{row[0]}</span>
                                                <span className="text-ink-muted hidden sm:inline">{row[1]}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span
                                                    className={`text-[11px] ${row[2] === 'Overdue' ? 'text-danger' : row[2] === 'Paid' ? 'text-ok' : 'text-ink-muted'}`}
                                                >
                                                    {row[2]}
                                                </span>
                                                <span className="text-ink tabular-nums">{row[3]}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="features" className="mx-auto max-w-6xl px-6 pb-20">
                        <div className="grid gap-4 md:grid-cols-3">
                            {[
                                {
                                    icon: FileText,
                                    title: 'Invoices that add up',
                                    body: 'Line items, per-line tax, percentage or fixed discounts and live totals. Numbers are reserved per company.',
                                },
                                {
                                    icon: ShieldCheck,
                                    title: 'Isolated by company',
                                    body: 'Every query is scoped to the signed-in company. Route binding, reports and public links never leak across tenants.',
                                },
                                {
                                    icon: LineChart,
                                    title: 'Reporting built in',
                                    body: 'Monthly billed versus collected, ageing buckets, top customers and tax summaries with CSV export.',
                                },
                            ].map((feature) => (
                                <div key={feature.title} className="border-hairline bg-surface rounded-xl border p-6">
                                    <feature.icon className="text-ink h-5 w-5" />
                                    <h3 className="text-ink mt-4 text-lg font-medium tracking-tight">{feature.title}</h3>
                                    <p className="text-ink-muted mt-2 text-sm leading-relaxed">{feature.body}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section id="tenancy" className="border-hairline bg-surface border-y">
                        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2">
                            <div>
                                <p className="text-ink-subtle text-[11px] tracking-[0.08em] uppercase">Multi-tenant by design</p>
                                <h2 className="text-display text-ink mt-4 text-[40px]">One install. Every company its own ledger.</h2>
                                <p className="text-ink-muted mt-4 max-w-lg text-sm leading-relaxed">
                                    Owners register a company, invite their team, and work inside a scoped workspace. Invoice prefixes and sequence
                                    numbers restart per company, and staff only ever see their own customers.
                                </p>
                                <ul className="text-ink-muted mt-6 space-y-3 text-sm">
                                    {[
                                        'Tenant-scoped models with global scopes',
                                        'Role-based access: owner, admin, staff',
                                        'Public invoice links with unguessable tokens',
                                    ].map((item) => (
                                        <li key={item} className="flex items-center gap-3">
                                            <span className="bg-ok-soft text-ok flex h-5 w-5 items-center justify-center rounded-full">
                                                <Check className="h-3 w-3" />
                                            </span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="border-hairline bg-canvas rounded-2xl border p-8">
                                <div className="flex items-center gap-3">
                                    <Layers className="text-ink h-5 w-5" />
                                    <p className="text-ink text-sm font-medium">Companies in this install</p>
                                </div>
                                <div className="mt-6 space-y-3">
                                    {['Acme Studio · ACM-0042', 'Northwind Labs · NW-0007'].map((row) => (
                                        <div
                                            key={row}
                                            className="border-hairline bg-surface flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                                        >
                                            <span className="text-ink">{row.split(' · ')[0]}</span>
                                            <span className="text-ink-subtle text-xs">{row.split(' · ')[1]}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-ink-subtle mt-6 text-xs leading-relaxed">
                                    Same database, different tenant scopes. Numbers never collide and records never cross.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="mx-auto max-w-6xl px-6 py-20">
                        <div className="border-hairline bg-surface rounded-xl border p-10 md:p-14">
                            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h2 className="text-display text-ink text-[32px] md:text-[40px]">Ready to invoice your first client?</h2>
                                    <p className="text-ink-muted mt-2 text-sm">
                                        Create a workspace in under a minute. No credit card, no setup calls.
                                    </p>
                                </div>
                                <Button asChild className="bg-ink hover:bg-ink/90 h-11 shrink-0 px-6 text-[15px] text-white">
                                    <Link href={route('register')}>Start free</Link>
                                </Button>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-hairline border-t">
                    <div className="text-ink-muted mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-xs sm:flex-row sm:items-center sm:justify-between">
                        <p>Simple Invoices · a Laravel rewrite of the classic billing system</p>
                        <div className="flex gap-5">
                            <Link href={route('login')} className="hover:text-ink">
                                Log in
                            </Link>
                            <Link href={route('register')} className="hover:text-ink">
                                Create workspace
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
