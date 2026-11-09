<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        $admin = User::create([
            'name'     => 'Admin',
            'email'    => 'admin@roombooking.com',
            'password' => Hash::make('password'),
            'role'     => 'admin',
            'phone'    => '081234567890',
            'position' => 'Office Manager & GA',
        ]);

        // Regular user
        $user = User::create([
            'name'     => 'Budi Santoso',
            'email'    => 'budi@example.com',
            'password' => Hash::make('password'),
            'role'     => 'user',
            'phone'    => '082345678901',
            'position' => 'Staff IT & Operation',
        ]);

        // Rooms
        $roomsData = [
            [
                'name'           => 'Ruang Rapat Utama',
                'description'    => 'Ruang rapat besar dengan kapasitas 20 orang, dilengkapi proyektor 4K, sound system, dan papan tulis digital.',
                'location'       => 'Lantai 2, Gedung A',
                'capacity'       => 20,
                'price_per_hour' => 0,
                'facilities'     => ['Proyektor 4K', 'AC', 'Papan Tulis Digital', 'WiFi 100Mbps', 'Sound System'],
                'is_available'   => true,
            ],
            [
                'name'           => 'Ruang Training',
                'description'    => 'Ruang training luas untuk pelatihan karyawan dengan setup classroom modern.',
                'location'       => 'Lantai 3, Gedung A',
                'capacity'       => 30,
                'price_per_hour' => 0,
                'facilities'     => ['Proyektor', 'AC', 'Mic Wireless', 'Meja Training', 'WiFi', 'Papan Tulis'],
                'is_available'   => true,
            ],
            [
                'name'           => 'Ruang Meeting Kecil',
                'description'    => 'Ruang meeting kecil dan nyaman untuk diskusi tim kecil.',
                'location'       => 'Lantai 1, Gedung B',
                'capacity'       => 8,
                'price_per_hour' => 0,
                'facilities'     => ['Smart TV 55"', 'AC', 'WiFi', 'Whiteboard'],
                'is_available'   => true,
            ],
            [
                'name'           => 'Aula Serbaguna',
                'description'    => 'Aula besar untuk seminar, konferensi, dan pameran perusahaan.',
                'location'       => 'Gedung C, Lantai 1',
                'capacity'       => 100,
                'price_per_hour' => 0,
                'facilities'     => ['Stage', 'Sound System Profesional', 'AC', 'Lighting', 'WiFi', 'Area Parkir'],
                'is_available'   => true,
            ],
            [
                'name'           => 'Ruang Kreatif',
                'description'    => 'Ruang dengan desain modern dan fleksibel untuk sesi brainstorming dan workshop.',
                'location'       => 'Lantai 4, Gedung A',
                'capacity'       => 12,
                'price_per_hour' => 0,
                'facilities'     => ['Smart TV', 'Papan Tulis Digital', 'AC', 'WiFi', 'Bean Bag', 'Standing Desk'],
                'is_available'   => true,
            ],
            [
                'name'           => 'Ruang Eksekutif',
                'description'    => 'Ruang meeting premium untuk pertemuan level direksi dan tamu VIP.',
                'location'       => 'Lantai 5, Gedung A',
                'capacity'       => 10,
                'price_per_hour' => 0,
                'facilities'     => ['Layar 75"', 'Video Conference HD', 'AC', 'WiFi', 'Minuman Gratis', 'Loker'],
                'is_available'   => true,
            ],
        ];

        $rooms = [];
        foreach ($roomsData as $data) {
            $rooms[] = Room::create($data);
        }

        // Sample bookings
        Booking::create([
            'user_id'        => $user->id,
            'room_id'        => $rooms[0]->id,
            'booking_date'   => now()->addDays(2)->format('Y-m-d'),
            'start_time'     => '09:00',
            'end_time'       => '11:00',
            'duration_hours' => 2,
            'total_price'    => 0,
            'status'         => 'confirmed',
            'notes'          => 'Rapat bulanan tim marketing',
        ]);

        Booking::create([
            'user_id'        => $user->id,
            'room_id'        => $rooms[2]->id,
            'booking_date'   => now()->addDays(5)->format('Y-m-d'),
            'start_time'     => '13:00',
            'end_time'       => '15:00',
            'duration_hours' => 2,
            'total_price'    => 0,
            'status'         => 'confirmed',
            'notes'          => 'Diskusi project Q4',
        ]);
    }
}
