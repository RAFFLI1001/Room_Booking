<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::table('users')->where('email', 'like', '%budi%')->whereNull('avatar')->update([
            'avatar' => 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face'
        ]);

        DB::table('users')->where('role', 'admin')->whereNull('avatar')->update([
            'avatar' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'
        ]);
    }

    public function down(): void
    {
    }
};
