<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::table('users')->where('role', 'admin')->whereNull('position')->update(['position' => 'Office Manager & GA']);
        DB::table('users')->where('email', 'like', '%budi%')->whereNull('position')->update(['position' => 'Staff IT & Operation']);
        DB::table('users')->whereNull('position')->update(['position' => 'Karyawan']);
    }

    public function down(): void
    {
    }
};
