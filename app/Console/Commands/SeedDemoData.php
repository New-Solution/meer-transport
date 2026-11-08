<?php

namespace App\Console\Commands;

use App\Actions\Companies\CreateCompany;
use App\Enums\ContractStatus;
use App\Enums\OrderStatus;
use App\Enums\TripStatus;
use App\Enums\TruckVehicleType;
use App\Models\Company;
use App\Models\Contract;
use App\Models\ContractRoute;
use App\Models\Customer;
use App\Models\Destination;
use App\Models\Driver;
use App\Models\Truck;
use App\Models\TransportOrder;
use App\Models\TransportTrip;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SeedDemoData extends Command
{
    protected $signature = 'demo:seed
        {--email= : Email of the user who should receive the data}
        {--company= : Seed this specific company ID instead of resolving one from --email}
        {--new-company= : Create a new company with this name (owned by --email) and seed it}
        {--fresh : Delete the target company\'s existing data first}';

    protected $description = 'Seed realistic demo data (customers, trucks, drivers, contracts, orders) for a company';

    public function handle(): int
    {
        $user = $this->option('email')
            ? User::where('email', $this->option('email'))->first()
            : User::first();

        if (! $user) {
            $this->error('No matching user found.');

            return self::FAILURE;
        }

        if ($newCompanyName = $this->option('new-company')) {
            $company = app(CreateCompany::class)->handle($user, $newCompanyName, isPersonal: false);
        } elseif ($companyId = $this->option('company')) {
            $company = Company::find($companyId);
        } else {
            $company = $user->currentCompany ?? $user->ownedCompanies()->first();
        }

        if (! $company) {
            $this->error('No target company found.');

            return self::FAILURE;
        }

        if ($this->option('fresh')) {
            $this->wipe($company);
        }

        DB::transaction(fn () => $this->seed($company));

        $this->info("Demo data seeded for company: {$company->name}");

        return self::SUCCESS;
    }

    private function wipe(Company $company): void
    {
        TransportTrip::where('company_id', $company->id)->delete();
        TransportOrder::where('company_id', $company->id)->delete();
        ContractRoute::where('company_id', $company->id)->delete();
        Contract::where('company_id', $company->id)->delete();
        Customer::where('company_id', $company->id)->delete();
        Truck::where('company_id', $company->id)->delete();
        Driver::where('company_id', $company->id)->delete();
        Destination::where('company_id', $company->id)->delete();
    }

    private function seed(Company $company): void
    {
        $customers = Customer::factory()->count(6)->for($company)->create();
        $trucks = Truck::factory()->count(6)->for($company)->create();
        $drivers = Driver::factory()->count(6)->for($company)->create();
        Destination::factory()->count(8)->for($company)->create();

        $cities = ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar', 'Abha', 'Tabuk'];
        $vehicleTypes = TruckVehicleType::cases();

        $contracts = collect([
            $this->makeContract($company, $customers->random(), ContractStatus::Active),
            $this->makeContract($company, $customers->random(), ContractStatus::Active),
            $this->makeContract($company, $customers->random(), ContractStatus::Draft),
            $this->makeContract($company, $customers->random(), ContractStatus::Active, expired: true),
            $this->makeContract($company, $customers->random(), ContractStatus::Cancelled),
        ]);

        $routesByContract = [];

        foreach ($contracts as $contract) {
            $routes = collect();

            foreach (range(1, fake()->numberBetween(1, 2)) as $i) {
                [$from, $to] = fake()->randomElements($cities, 2);

                $routes->push(ContractRoute::factory()->for($company)->for($contract)->create([
                    'from_city' => $from,
                    'to_city' => $to,
                    'vehicle_type' => fake()->randomElement($vehicleTypes)->value,
                    'price_halalas' => fake()->numberBetween(200, 800) * 100,
                    'sort_order' => $i,
                ]));
            }

            $routesByContract[$contract->id] = $routes;
        }

        $activeContracts = $contracts->filter(fn (Contract $c) => $c->status === ContractStatus::Active)->values();
        $orderStatuses = [OrderStatus::Draft, OrderStatus::Confirmed, OrderStatus::Confirmed, OrderStatus::Cancelled];

        foreach (range(1, 8) as $i) {
            $contract = $activeContracts->random();
            $route = $routesByContract[$contract->id]->random();
            $customer = Customer::find($contract->customer_id);
            $status = fake()->randomElement($orderStatuses);

            $order = TransportOrder::factory()->for($company)->create([
                'order_date' => now()->subDays(fake()->numberBetween(0, 20))->format('Y-m-d'),
                'required_delivery_date' => now()->addDays(fake()->numberBetween(1, 10))->format('Y-m-d'),
                'customer_id' => $customer->id,
                'customer_snapshot' => $this->customerSnapshot($customer),
                'contract_id' => $contract->id,
                'contract_snapshot' => [
                    'id' => $contract->id,
                    'contract_number' => $contract->contract_number,
                    'contract_date' => $contract->contract_date->format('Y-m-d'),
                    'expiry_date' => $contract->expiry_date->format('Y-m-d'),
                    'snapshot_at' => now()->toIso8601String(),
                ],
                'contract_route_id' => $route->id,
                'route_snapshot' => [
                    'id' => $route->id,
                    'from_city' => $route->from_city,
                    'to_city' => $route->to_city,
                    'destination_id' => null,
                    'destination_name' => null,
                    'destination_google_maps_url' => null,
                    'vehicle_type' => $route->vehicle_type,
                    'original_price_halalas' => $route->price_halalas,
                    'return_price_halalas' => $route->return_price_halalas,
                    'stay_price_halalas' => $route->stay_price_halalas,
                    'stop_price_halalas' => $route->stop_price_halalas,
                    'additional_price_halalas' => $route->additional_price_halalas,
                    'snapshot_at' => now()->toIso8601String(),
                ],
                'applied_price_halalas' => $route->price_halalas,
                'trip_count' => 1,
                'total_amount_halalas' => $route->price_halalas,
                'status' => $status,
                'confirmed_at' => $status === OrderStatus::Confirmed ? now() : null,
                'confirmed_by' => $status === OrderStatus::Confirmed ? 'Demo Seeder' : null,
                'cancelled_at' => $status === OrderStatus::Cancelled ? now() : null,
                'cancelled_by' => $status === OrderStatus::Cancelled ? 'Demo Seeder' : null,
                'cancellation_reason' => $status === OrderStatus::Cancelled ? 'Demo cancellation' : null,
            ]);

            TransportTrip::factory()->for($company)->for($order, 'order')->create([
                'trip_number' => $order->order_number.'-T1',
                'sequence_number' => 1,
                'status' => match ($status) {
                    OrderStatus::Confirmed => TripStatus::Confirmed,
                    OrderStatus::Cancelled => TripStatus::Cancelled,
                    default => TripStatus::Draft,
                },
                'from_city' => $route->from_city,
                'to_city' => $route->to_city,
                'vehicle_type' => $route->vehicle_type,
                'applied_price_halalas' => $route->price_halalas,
                'truck_id' => $status === OrderStatus::Confirmed ? $trucks->random()->id : null,
                'driver_id' => $status === OrderStatus::Confirmed ? $drivers->random()->id : null,
            ]);
        }
    }

    private function makeContract(Company $company, Customer $customer, ContractStatus $status, bool $expired = false): Contract
    {
        $factory = Contract::factory()->for($company)->for($customer)->state([
            'customer_snapshot' => $this->customerSnapshot($customer),
            'status' => $status,
        ]);

        if ($expired) {
            $factory = $factory->expired();
        }

        if ($status === ContractStatus::Cancelled) {
            $factory = $factory->cancelled();
        }

        if ($status === ContractStatus::Draft) {
            $factory = $factory->draft();
        }

        return $factory->create();
    }

    /**
     * @return array<string, mixed>
     */
    private function customerSnapshot(Customer $customer): array
    {
        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'cr_number' => $customer->cr_number,
            'unified_number' => $customer->unified_number,
            'vat_number' => $customer->vat_number,
            'address' => $customer->address,
            'snapshot_at' => now()->toIso8601String(),
        ];
    }
}
