import { Head, Link } from '@inertiajs/react';
import { Eye, LogOut, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import CreateCompanyModal from '@/components/create-company-modal';
import Heading from '@/components/heading';
import LeaveCompanyModal from '@/components/leave-company-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { edit, index } from '@/routes/companies';
import type { Company } from '@/types';

type Props = {
    companies: Company[];
};

export default function CompaniesIndex({ companies }: Props) {
    const [leaveCompanyDialogOpen, setLeaveCompanyDialogOpen] = useState(false);
    const [companyLeaving, setCompanyLeaving] = useState<Company | null>(null);

    const openLeaveCompanyDialog = (company: Company) => {
        setCompanyLeaving(company);
        setLeaveCompanyDialogOpen(true);
    };

    return (
        <>
            <Head title="Companies" />

            <h1 className="sr-only">Companies</h1>

            <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Companies"
                        description="Manage your companies and company memberships"
                    />

                    <CreateCompanyModal>
                        <Button data-test="companies-new-company-button">
                            <Plus /> New company
                        </Button>
                    </CreateCompanyModal>
                </div>

                <div className="space-y-3">
                    {companies.map((company) => {
                        const canLeaveCompany =
                            !company.isPersonal && company.role !== 'owner';

                        return (
                            <div
                                key={company.id}
                                data-test="company-row"
                                className="flex items-center justify-between gap-4 rounded-lg border p-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {company.name}
                                            </span>
                                            {company.isPersonal ? (
                                                <Badge variant="secondary">
                                                    Personal
                                                </Badge>
                                            ) : null}
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {company.roleLabel}
                                        </span>
                                    </div>
                                </div>

                                <TooltipProvider>
                                    <div className="flex items-center gap-2">
                                        {canLeaveCompany ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        data-test="company-leave-button"
                                                        onClick={() =>
                                                            openLeaveCompanyDialog(
                                                                company,
                                                            )
                                                        }
                                                    >
                                                        <LogOut className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Leave company</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : null}

                                        {company.role === 'member' ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        data-test="company-view-button"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={edit(
                                                                company.slug,
                                                            )}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>View company</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        data-test="company-edit-button"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={edit(
                                                                company.slug,
                                                            )}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Edit company</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </TooltipProvider>
                            </div>
                        );
                    })}

                    {companies.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">
                            You don't belong to any companies yet.
                        </p>
                    ) : null}
                </div>
            </div>

            <LeaveCompanyModal
                company={companyLeaving}
                open={leaveCompanyDialogOpen}
                onOpenChange={setLeaveCompanyDialogOpen}
            />
        </>
    );
}

CompaniesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Companies',
            href: index(),
        },
    ],
};
