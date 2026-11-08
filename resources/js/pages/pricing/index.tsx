import { Head } from '@inertiajs/react';
import { Tag } from 'lucide-react';
import Heading from '@/components/heading';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard } from '@/routes';
import { index } from '@/routes/pricing';
import type { Company } from '@/types';

type Props = {
    currentCompany: Company;
};

export default function PricingIndex({
    currentCompany: _currentCompany,
}: Props) {
    return (
        <>
            <Head title="Pricing & Tariffs" />

            <div className="flex flex-col space-y-6 p-4">
                <Heading
                    title="Pricing & Tariffs"
                    description="Route pricing management and contract tariff lookups"
                />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Pricing module (future milestone)
                        </CardTitle>
                        <CardDescription>
                            Route pricing is currently managed per contract. See
                            Contracts and the Contract Routes report for current
                            tariffs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                            Future functionality includes inter-city route price
                            matrices and contract-specific rate comparisons.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

PricingIndex.layout = (props: { currentCompany?: Company | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentCompany
                ? dashboard(props.currentCompany.slug)
                : '/',
        },
        {
            title: 'Pricing',
            href: props.currentCompany
                ? index({ current_company: props.currentCompany.slug })
                : '/',
        },
    ],
});
