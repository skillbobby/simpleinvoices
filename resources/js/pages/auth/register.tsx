import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        company_name: '',
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="Start your workspace"
            description="Create a company workspace and become its owner. Your data stays isolated from every other company."
        >
            <Head title="Create your workspace" />
            <form className="flex flex-col gap-5" onSubmit={submit}>
                <div className="grid gap-2">
                    <Label htmlFor="company_name">Company name</Label>
                    <Input
                        id="company_name"
                        type="text"
                        required
                        autoFocus
                        tabIndex={1}
                        autoComplete="organization"
                        value={data.company_name}
                        onChange={(event) => setData('company_name', event.target.value)}
                        disabled={processing}
                        placeholder="Acme Studio"
                        className="border-hairline bg-surface h-11"
                    />
                    <p className="text-ink-subtle text-xs">This becomes your tenant — invoices are numbered from this company only.</p>
                    <InputError message={errors.company_name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="name">Your name</Label>
                    <Input
                        id="name"
                        type="text"
                        required
                        tabIndex={2}
                        autoComplete="name"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        disabled={processing}
                        placeholder="Full name"
                        className="border-hairline bg-surface h-11"
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email">Work email</Label>
                    <Input
                        id="email"
                        type="email"
                        required
                        tabIndex={3}
                        autoComplete="email"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        disabled={processing}
                        placeholder="you@company.com"
                        className="border-hairline bg-surface h-11"
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(event) => setData('password', event.target.value)}
                            disabled={processing}
                            placeholder="Password"
                            className="border-hairline bg-surface h-11"
                        />
                        <InputError message={errors.password} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirm</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            required
                            tabIndex={5}
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(event) => setData('password_confirmation', event.target.value)}
                            disabled={processing}
                            placeholder="Repeat password"
                            className="border-hairline bg-surface h-11"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>
                </div>

                <Button type="submit" className="bg-ink hover:bg-ink/90 mt-2 h-11 w-full text-white" tabIndex={6} disabled={processing}>
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Create workspace
                </Button>

                <p className="text-ink-muted text-center text-sm">
                    Already have an account?{' '}
                    <TextLink href={route('login')} tabIndex={7}>
                        Log in
                    </TextLink>
                </p>
            </form>
        </AuthLayout>
    );
}
