<?php

use App\Http\Controllers\ContractController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DestinationController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\PricingController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TransportOrderController;
use App\Http\Controllers\TruckController;
use Illuminate\Support\Facades\Route;

Route::resource('destinations', DestinationController::class)->except(['show', 'create', 'edit']);

Route::resource('customers', CustomerController::class)->except(['show', 'create', 'edit']);
Route::patch('customers/{customer}/archive', [CustomerController::class, 'archive'])->name('customers.archive');
Route::patch('customers/{customer}/restore', [CustomerController::class, 'restore'])->name('customers.restore');

Route::resource('trucks', TruckController::class)->except(['show', 'create', 'edit']);

Route::resource('drivers', DriverController::class)->except(['show', 'create', 'edit']);

Route::resource('contracts', ContractController::class);
Route::patch('contracts/{contract}/activate', [ContractController::class, 'activate'])->name('contracts.activate');
Route::patch('contracts/{contract}/cancel', [ContractController::class, 'cancel'])->name('contracts.cancel');
Route::patch('contracts/{contract}/archive', [ContractController::class, 'archive'])->name('contracts.archive');

Route::resource('transport-orders', TransportOrderController::class);
Route::patch('transport-orders/{transport_order}/confirm', [TransportOrderController::class, 'confirm'])->name('transport-orders.confirm');
Route::patch('transport-orders/{transport_order}/cancel', [TransportOrderController::class, 'cancel'])->name('transport-orders.cancel');

Route::get('pricing', [PricingController::class, 'index'])->name('pricing.index');

Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
Route::get('reports/export', [ReportController::class, 'download'])->name('reports.download');
