import { cn } from '@/lib/utils';

type BadgeTone = 'success' | 'warning' | 'danger' | 'default';

const toneClasses: Record<BadgeTone, string> = {
    success:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
    warning:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800',
    default:
        'bg-slate-100 text-slate-700 border-transparent dark:bg-slate-800 dark:text-slate-300',
};

function ToneBadge({
    tone,
    children,
    className,
}: {
    tone: BadgeTone;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium',
                toneClasses[tone],
                className,
            )}
        >
            {children}
        </span>
    );
}

const CONTRACT_STATUS: Record<string, { tone: BadgeTone; label: string }> = {
    ACTIVE: { tone: 'success', label: 'Active' },
    DRAFT: { tone: 'warning', label: 'Draft' },
    EXPIRED: { tone: 'danger', label: 'Expired' },
    CANCELLED: { tone: 'default', label: 'Cancelled' },
};

export function ContractStatusBadge({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    const entry = CONTRACT_STATUS[status] ?? { tone: 'default', label: status };

    return (
        <ToneBadge tone={entry.tone} className={className}>
            {entry.label}
        </ToneBadge>
    );
}

const ORDER_STATUS: Record<string, { tone: BadgeTone; label: string }> = {
    CONFIRMED: { tone: 'success', label: 'Confirmed' },
    DRAFT: { tone: 'warning', label: 'Draft' },
    CANCELLED: { tone: 'default', label: 'Cancelled' },
};

export function OrderStatusBadge({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    const entry = ORDER_STATUS[status] ?? { tone: 'default', label: status };

    return (
        <ToneBadge tone={entry.tone} className={className}>
            {entry.label}
        </ToneBadge>
    );
}
