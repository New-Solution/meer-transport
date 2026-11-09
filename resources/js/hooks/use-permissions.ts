import { usePage } from '@inertiajs/react';
import type { BusinessPermission } from '@/types/permissions';

export type UsePermissionsReturn = {
    can: (permission: BusinessPermission) => boolean;
};

export function usePermissions(): UsePermissionsReturn {
    const { businessPermissions } = usePage().props;

    return {
        can: (permission: BusinessPermission) =>
            businessPermissions.includes(permission),
    };
}
