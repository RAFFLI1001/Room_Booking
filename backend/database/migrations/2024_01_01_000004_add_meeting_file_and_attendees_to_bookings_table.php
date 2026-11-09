<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('meeting_file')->nullable()->after('notes');
            $table->string('meeting_file_name')->nullable()->after('meeting_file');
            $table->json('attendees')->nullable()->after('meeting_file_name');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['meeting_file', 'meeting_file_name', 'attendees']);
        });
    }
};
