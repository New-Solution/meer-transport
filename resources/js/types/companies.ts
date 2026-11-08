export type CompanyRole = 'owner' | 'admin' | 'member';

export type Company = {
    id: number;
    name: string;
    slug: string;
    isPersonal: boolean;
    role?: CompanyRole;
    roleLabel?: string;
    isCurrent?: boolean;
};

export type BusinessRole =
    | 'admin'
    | 'operations_manager'
    | 'dispatcher'
    | 'viewer';

export type CompanyMember = {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    role: CompanyRole;
    role_label: string;
    business_role: BusinessRole;
    business_role_label: string;
};

export type CompanyInvitation = {
    code: string;
    email: string;
    role: CompanyRole;
    role_label: string;
    created_at: string;
};

export type CompanyInvitationContext = {
    code: string;
    companyName: string;
};

export type DashboardInvitation = {
    code: string;
    inviterName: string;
    company: {
        name: string;
        slug: string;
    };
};

export type CompanyPermissions = {
    canUpdateCompany: boolean;
    canDeleteCompany: boolean;
    canAddMember: boolean;
    canUpdateMember: boolean;
    canRemoveMember: boolean;
    canCreateInvitation: boolean;
    canCancelInvitation: boolean;
};

export type RoleOption = {
    value: CompanyRole;
    label: string;
};

export type BusinessRoleOption = {
    value: BusinessRole;
    label: string;
};
