import { Head, Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { home } from '@/routes';

type Props = {
    status: number;
};

const CONTENT: Record<number, { title: string; description: string }> = {
    403: {
        title: 'Access denied',
        description:
            "You don't have permission to do this. If you think this is a mistake, contact someone with access to manage roles for this company.",
    },
    404: {
        title: 'Page not found',
        description:
            "The page you're looking for doesn't exist or may have been moved.",
    },
    419: {
        title: 'Page expired',
        description: 'This page expired for your security. Please try again.',
    },
    429: {
        title: 'Too many requests',
        description:
            "You've made too many requests in a short time. Please wait a moment and try again.",
    },
    500: {
        title: 'Something went wrong',
        description:
            'An unexpected error occurred on our end. Please try again shortly.',
    },
    503: {
        title: 'Down for maintenance',
        description:
            "We're performing scheduled maintenance. Please check back shortly.",
    },
};

export default function ErrorPage({ status }: Props) {
    const { title, description } = CONTENT[status] ?? {
        title: 'Unexpected error',
        description: 'Something went wrong while loading this page.',
    };

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 text-center md:p-10">
            <Head title={title} />

            <Link href={home()} className="flex flex-col items-center gap-2">
                <AppLogoIcon className="size-9 fill-current text-foreground" />
            </Link>

            <div className="space-y-2">
                <p className="font-mono text-sm font-semibold text-muted-foreground">
                    {status}
                </p>
                <h1 className="text-2xl font-semibold">{title}</h1>
                <p className="max-w-sm text-sm text-muted-foreground">
                    {description}
                </p>
            </div>

            <Button asChild>
                <Link href={home()}>Go to dashboard</Link>
            </Button>
        </div>
    );
}
