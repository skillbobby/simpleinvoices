import EmptyState from '@/components/empty-state';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Trash2, UserPlus } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/company' },
    { title: 'Team', href: '/settings/team' },
];

type TeamRole = 'owner' | 'admin' | 'staff';

interface TeamMember {
    id: number;
    name: string;
    email: string;
    job_title: string | null;
    role: TeamRole;
    is_active: boolean;
    is_self: boolean;
    created_at: string;
}

interface RoleOption {
    value: string;
    label: string;
}

interface TeamProps {
    members: TeamMember[];
    roles: RoleOption[];
}

type AddMemberFormData = {
    name: string;
    email: string;
    job_title: string;
    role: string;
    password: string;
    password_confirmation: string;
};

const cardClass = 'rounded-xl border border-hairline bg-surface p-6';
const controlClass = 'border-hairline bg-surface text-sm';
const selectClass =
    'border-hairline bg-surface text-ink focus:ring-ring h-9 w-full rounded-md border px-2 text-sm focus:ring-2 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-60';

function MemberRow({ member, roles }: { member: TeamMember; roles: RoleOption[] }) {
    const [role, setRole] = useState<TeamRole>(member.role);
    const [isActive, setIsActive] = useState(member.is_active);
    const [processing, setProcessing] = useState(false);

    const isOwner = member.role === 'owner';
    const dirty = role !== member.role || isActive !== member.is_active;

    const save = () => {
        router.patch(
            route('settings.team.update', member.id),
            { role, is_active: isActive },
            { preserveScroll: true, onStart: () => setProcessing(true), onFinish: () => setProcessing(false) },
        );
    };

    const remove = () => {
        if (window.confirm(`Remove ${member.name} from this workspace? They will lose access immediately.`)) {
            router.delete(route('settings.team.destroy', member.id), { preserveScroll: true });
        }
    };

    return (
        <tr className="border-hairline-soft hover:bg-canvas/50 border-b transition-colors last:border-0">
            <td className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-ink font-medium">{member.name}</span>
                    {member.is_self ? (
                        <Badge variant="outline" className="border-hairline text-ink-subtle text-[10px]">
                            You
                        </Badge>
                    ) : null}
                    {isOwner ? (
                        <Badge variant="outline" className="bg-ink border-transparent text-[10px] text-white">
                            Owner
                        </Badge>
                    ) : null}
                </div>
                <p className="text-ink-subtle mt-0.5 text-xs">{member.email}</p>
                {member.job_title ? <p className="text-ink-muted mt-0.5 text-xs">{member.job_title}</p> : null}
            </td>
            <td className="px-5 py-4">
                {isOwner ? (
                    <span className="text-ink-muted text-sm">Owner</span>
                ) : (
                    <select
                        aria-label={`Role for ${member.name}`}
                        value={role}
                        onChange={(event) => setRole(event.target.value as TeamRole)}
                        disabled={member.is_self}
                        className={selectClass}
                    >
                        {roles.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                )}
            </td>
            <td className="px-5 py-4">
                {isOwner ? (
                    <span className="text-ok inline-flex items-center gap-1.5 text-[11px] font-medium">
                        <span className="bg-ok h-1.5 w-1.5 rounded-full" />
                        Active
                    </span>
                ) : (
                    <label className="inline-flex cursor-pointer items-center gap-2">
                        <Checkbox checked={isActive} onCheckedChange={(checked) => setIsActive(checked === true)} disabled={member.is_self} />
                        <span className="text-ink-muted text-xs">{isActive ? 'Active' : 'Inactive'}</span>
                    </label>
                )}
            </td>
            <td className="text-ink-muted px-5 py-4 text-xs whitespace-nowrap">{formatDate(member.created_at)}</td>
            <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-1">
                    {isOwner ? (
                        <span className="text-ink-subtle pr-2 text-xs">Owner</span>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={save}
                                disabled={!dirty || processing || member.is_self}
                                className="h-8 px-2.5"
                            >
                                {processing ? 'Saving…' : 'Save'}
                            </Button>
                            {member.is_self ? null : (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={remove}
                                    className="text-ink-muted hover:text-danger h-8 px-2"
                                >
                                    <Trash2 className="h-3.5 w-3.5" /> Remove
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}

function AddMemberForm({ roles }: { roles: RoleOption[] }) {
    const defaultRole = roles.find((option) => option.value === 'staff')?.value ?? roles[0]?.value ?? 'staff';

    const form = useForm<AddMemberFormData>({
        name: '',
        email: '',
        job_title: '',
        role: defaultRole,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        form.post(route('settings.team.store'), { preserveScroll: true, onSuccess: () => form.reset() });
    };

    return (
        <section className={cn(cardClass, 'space-y-5')}>
            <div className="border-hairline space-y-1 border-b pb-4">
                <h2 className="text-ink text-base font-medium">Add team member</h2>
                <p className="text-ink-muted text-sm">Create a sign-in for a colleague and choose their access level.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div className="grid gap-2">
                    <Label htmlFor="member_name">Name</Label>
                    <Input
                        id="member_name"
                        value={form.data.name}
                        onChange={(event) => form.setData('name', event.target.value)}
                        placeholder="Alex Morgan"
                        autoComplete="name"
                        required
                        className={controlClass}
                    />
                    <InputError message={form.errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="member_email">Email address</Label>
                    <Input
                        id="member_email"
                        type="email"
                        value={form.data.email}
                        onChange={(event) => form.setData('email', event.target.value)}
                        placeholder="alex@company.com"
                        autoComplete="email"
                        required
                        className={controlClass}
                    />
                    <InputError message={form.errors.email} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="member_job_title">Job title</Label>
                    <Input
                        id="member_job_title"
                        value={form.data.job_title}
                        onChange={(event) => form.setData('job_title', event.target.value)}
                        placeholder="Bookkeeper"
                        autoComplete="organization-title"
                        className={controlClass}
                    />
                    <InputError message={form.errors.job_title} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="member_role">Role</Label>
                    <select
                        id="member_role"
                        value={form.data.role}
                        onChange={(event) => form.setData('role', event.target.value)}
                        className={selectClass}
                    >
                        {roles.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <InputError message={form.errors.role} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="member_password">Password</Label>
                    <Input
                        id="member_password"
                        type="password"
                        value={form.data.password}
                        onChange={(event) => form.setData('password', event.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        required
                        className={controlClass}
                    />
                    <p className="text-ink-subtle text-xs">Minimum 8 characters.</p>
                    <InputError message={form.errors.password} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="member_password_confirmation">Confirm password</Label>
                    <Input
                        id="member_password_confirmation"
                        type="password"
                        value={form.data.password_confirmation}
                        onChange={(event) => form.setData('password_confirmation', event.target.value)}
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        required
                        className={controlClass}
                    />
                    <InputError message={form.errors.password_confirmation} />
                </div>

                <Button type="submit" disabled={form.processing} className="w-full">
                    <UserPlus /> Add team member
                </Button>
            </form>
        </section>
    );
}

export default function Team({ members, roles }: TeamProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Team" />

            <SettingsLayout>
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <section className={cn(cardClass, 'p-0')}>
                        <div className="border-hairline flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                            <div className="space-y-1">
                                <h2 className="text-ink text-base font-medium">Team members</h2>
                                <p className="text-ink-muted text-sm">People with access to this workspace. Admins can manage settings and team.</p>
                            </div>
                            <Badge variant="outline" className="border-hairline text-ink-muted">
                                {members.length} {members.length === 1 ? 'member' : 'members'}
                            </Badge>
                        </div>

                        {members.length === 0 ? (
                            <div className="p-5">
                                <EmptyState
                                    icon={<UserPlus className="h-6 w-6" />}
                                    title="No team members yet"
                                    description="Add a colleague with the form to give them access."
                                />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-hairline text-ink-subtle border-b text-[11px] tracking-wide uppercase">
                                            <th className="px-5 py-3 text-left font-medium">Member</th>
                                            <th className="px-5 py-3 text-left font-medium">Role</th>
                                            <th className="px-5 py-3 text-left font-medium">Active</th>
                                            <th className="px-5 py-3 text-left font-medium">Added</th>
                                            <th className="px-5 py-3 text-right font-medium">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.map((member) => (
                                            <MemberRow key={member.id} member={member} roles={roles} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <div className="xl:sticky xl:top-20 xl:self-start">
                        <AddMemberForm roles={roles} />
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
