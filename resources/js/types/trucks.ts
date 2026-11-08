export type TruckWeightType = 'HEAVY' | 'MEDIUM' | 'LIGHT';
export type TruckVehicleType = 'TANKER' | 'TRUCK' | 'LORRY' | 'DYANA';

export type Truck = {
    id: number;
    weight_type: TruckWeightType;
    vehicle_type: TruckVehicleType;
    license_plate: string;
    is_external: boolean;
    is_internal: boolean;
};
