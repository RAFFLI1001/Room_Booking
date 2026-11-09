<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->json('services')->nullable()->after('attendees');
            $table->string('check_in_code', 20)->nullable()->after('services');
            $table->timestamp('checked_in_at')->nullable()->after('check_in_code');
            $table->text('cancellation_reason')->nullable()->after('checked_in_at');
            $table->string('recurring_group_id', 64)->nullable()->after('cancellation_reason');
        });

        // Set default check_in_code for existing bookings
        $existing = DB::table('bookings')->whereNull('check_in_code')->get();
        foreach ($existing as $b) {
            DB::table('bookings')->where('id', $b->id)->update([
                'check_in_code' => strtoupper(Str::random(6)),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'services',
                'check_in_code',
                'checked_in_at',
                'cancellation_reason',
                'recurring_group_id',
            ]);
        });
    }
};
