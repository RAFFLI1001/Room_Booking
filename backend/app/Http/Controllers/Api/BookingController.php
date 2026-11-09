<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $bookings = $request->user()
            ->bookings()
            ->with('room')
            ->latest()
            ->get();

        return response()->json($bookings);
    }

    public function store(Request $request)
    {
        // Parse attendees if it comes as a JSON string via FormData
        if ($request->has('attendees') && is_string($request->attendees)) {
            $decoded = json_decode($request->attendees, true);
            if (is_array($decoded)) {
                $request->merge(['attendees' => $decoded]);
            }
        }

        // Parse services (equipment & catering) if sent as JSON string
        if ($request->has('services') && is_string($request->services)) {
            $decodedServices = json_decode($request->services, true);
            if (is_array($decodedServices)) {
                $request->merge(['services' => $decodedServices]);
            }
        }

        $validated = $request->validate([
            'room_id'        => 'required|exists:rooms,id',
            'booking_date'   => 'required|date|after_or_equal:today',
            'start_time'     => 'required|date_format:H:i',
            'end_time'       => 'required|date_format:H:i|after:start_time',
            'notes'          => 'nullable|string|max:500',
            'attendees'      => 'nullable|array',
            'services'       => 'nullable|array',
            'recurring_type' => 'nullable|string|in:none,weekly_4,biweekly_2,monthly_3',
            'meeting_file'   => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,zip,txt|max:10240',
        ]);

        $room = Room::findOrFail($validated['room_id']);

        if (!$room->is_available) {
            return response()->json(['message' => 'Ruangan tidak tersedia saat ini'], 422);
        }

        $startTimeStr = substr($validated['start_time'], 0, 5) . ':00';
        $endTimeStr   = substr($validated['end_time'], 0, 5) . ':00';

        // Calculate occurrence dates for recurring booking
        $recurringType = $validated['recurring_type'] ?? 'none';
        $dates = [];
        $baseDate = Carbon::parse($validated['booking_date']);

        if ($recurringType === 'weekly_4') {
            for ($i = 0; $i < 4; $i++) {
                $dates[] = $baseDate->copy()->addWeeks($i)->format('Y-m-d');
            }
        } elseif ($recurringType === 'biweekly_2') {
            for ($i = 0; $i < 2; $i++) {
                $dates[] = $baseDate->copy()->addWeeks($i * 2)->format('Y-m-d');
            }
        } elseif ($recurringType === 'monthly_3') {
            for ($i = 0; $i < 3; $i++) {
                $dates[] = $baseDate->copy()->addMonths($i)->format('Y-m-d');
            }
        } else {
            $dates = [$validated['booking_date']];
        }

        // Validate time conflict on ALL occurrence dates
        foreach ($dates as $date) {
            $conflict = Booking::where('room_id', $validated['room_id'])
                ->where('booking_date', $date)
                ->whereNotIn('status', ['cancelled'])
                ->where(function ($q) use ($startTimeStr, $endTimeStr) {
                    $q->where('start_time', '<', $endTimeStr)
                      ->where('end_time', '>', $startTimeStr);
                })->first();

            if ($conflict) {
                $conflictDateFormatted = Carbon::parse($date)->locale('id')->isoFormat('D MMMM Y');
                $existingStart = substr($conflict->start_time, 0, 5);
                $existingEnd   = substr($conflict->end_time, 0, 5);
                return response()->json([
                    'message' => "Bentrok jadwal pada {$conflictDateFormatted} (pukul {$existingStart} - {$existingEnd}). Silakan pilih jam atau tanggal lain.",
                ], 422);
            }
        }

        $start         = Carbon::createFromFormat('H:i', $validated['start_time']);
        $end           = Carbon::createFromFormat('H:i', $validated['end_time']);
        $durationHours = $start->diffInHours($end);

        $filePath = null;
        $fileName = null;

        if ($request->hasFile('meeting_file')) {
            $file = $request->file('meeting_file');
            $filePath = $file->store('meeting_files', 'public');
            $fileName = $file->getClientOriginalName();
        }

        $recurringGroupId = count($dates) > 1 ? 'REC_' . strtoupper(Str::random(10)) : null;
        $createdBookings = [];

        foreach ($dates as $index => $occurrenceDate) {
            $checkInCode = strtoupper(Str::random(6));

            $booking = Booking::create([
                'user_id'            => $request->user()->id,
                'room_id'            => $validated['room_id'],
                'booking_date'       => $occurrenceDate,
                'start_time'         => $validated['start_time'],
                'end_time'           => $validated['end_time'],
                'duration_hours'     => $durationHours,
                'total_price'        => 0,
                'status'             => 'confirmed',
                'notes'              => $validated['notes'] ?? null,
                'attendees'          => $validated['attendees'] ?? [],
                'services'           => $validated['services'] ?? null,
                'check_in_code'      => $checkInCode,
                'recurring_group_id' => $recurringGroupId,
                'meeting_file'       => $filePath,
                'meeting_file_name'  => $fileName,
            ]);

            $createdBookings[] = $booking;
        }

        $mainBooking = $createdBookings[0];
        $msg = count($createdBookings) > 1
            ? "Berhasil membuat " . count($createdBookings) . " sesi reservasi berulang"
            : 'Reservasi ruangan rapat berhasil dibuat';

        return response()->json([
            'message'  => $msg,
            'booking'  => $mainBooking->load('room', 'user'),
            'bookings' => $createdBookings,
        ], 201);
    }

    public function show(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Tidak diizinkan mengakses booking ini'], 403);
        }

        return response()->json($booking->load('room', 'user'));
    }

    public function cancel(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Tidak diizinkan membatalkan booking ini'], 403);
        }

        if (!in_array($booking->status, ['pending', 'confirmed'])) {
            return response()->json(['message' => 'Booking tidak dapat dibatalkan'], 422);
        }

        $reason = $request->input('cancellation_reason') ?: ($request->user()->isAdmin() ? 'Dibatalkan oleh Administrator' : 'Dibatalkan oleh Pemesan');

        $booking->update([
            'status'              => 'cancelled',
            'cancellation_reason' => $reason,
        ]);

        return response()->json([
            'message' => 'Booking berhasil dibatalkan',
            'booking' => $booking->load('room', 'user'),
        ]);
    }

    // Check-in via QR Code or PIN
    public function checkIn(Request $request, Booking $booking)
    {
        if ($booking->is_checked_in) {
            return response()->json([
                'message' => 'Ruangan sudah di-check-in sebelumnya pada ' . $booking->checked_in_at->format('H:i') . ' WIB.',
                'booking' => $booking->load('room', 'user'),
            ]);
        }

        // If code is supplied, check against booking's check_in_code
        if ($request->filled('code')) {
            $inputCode = strtoupper(trim($request->code));
            if ($inputCode !== strtoupper($booking->check_in_code)) {
                return response()->json([
                    'message' => 'Kode PIN Check-In tidak sesuai. Silakan periksa kembali kode Anda.',
                ], 422);
            }
        }

        $booking->update([
            'checked_in_at' => now(),
            'status'        => 'confirmed',
        ]);

        return response()->json([
            'message' => "Check-in ruangan '{$booking->room->name}' berhasil! Rapat dapat dimulai.",
            'booking' => $booking->fresh()->load('room', 'user'),
        ]);
    }

    // Upload / update meeting file
    public function uploadFile(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Tidak diizinkan mengunggah file untuk reservasi ini'], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,zip,txt|max:10240',
        ]);

        if ($booking->meeting_file) {
            Storage::disk('public')->delete($booking->meeting_file);
        }

        $file = $request->file('file');
        $filePath = $file->store('meeting_files', 'public');
        $fileName = $file->getClientOriginalName();

        $booking->update([
            'meeting_file'      => $filePath,
            'meeting_file_name' => $fileName,
        ]);

        return response()->json([
            'message' => 'Berkas hasil rapat berhasil diunggah',
            'booking' => $booking->fresh()->load('room', 'user'),
        ]);
    }

    // Delete meeting file
    public function deleteFile(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Tidak diizinkan menghapus file'], 403);
        }

        if ($booking->meeting_file) {
            Storage::disk('public')->delete($booking->meeting_file);
        }

        $booking->update([
            'meeting_file'      => null,
            'meeting_file_name' => null,
        ]);

        return response()->json([
            'message' => 'Berkas berhasil dihapus',
            'booking' => $booking->fresh()->load('room', 'user'),
        ]);
    }

    // Update attendees
    public function updateAttendees(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Tidak diizinkan mengubah peserta'], 403);
        }

        $validated = $request->validate([
            'attendees'   => 'present|array',
            'attendees.*' => 'nullable',
        ]);

        $booking->update([
            'attendees' => $validated['attendees'],
        ]);

        return response()->json([
            'message' => 'Daftar peserta rapat berhasil diperbarui',
            'booking' => $booking->fresh()->load('room', 'user'),
        ]);
    }

    // Admin: semua booking
    public function adminIndex(Request $request)
    {
        $query = Booking::with('user', 'room')->latest();

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->room_id) {
            $query->where('room_id', $request->room_id);
        }
        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        return response()->json($query->paginate(20));
    }

    public function updateStatus(Request $request, Booking $booking)
    {
        $request->validate([
            'status'              => 'required|in:pending,confirmed,cancelled,completed',
            'cancellation_reason' => 'nullable|string|max:500',
        ]);

        $updates = ['status' => $request->status];
        if ($request->status === 'cancelled') {
            $updates['cancellation_reason'] = $request->cancellation_reason ?: 'Dibatalkan oleh Administrator';
        }

        $booking->update($updates);

        return response()->json([
            'message' => 'Status booking berhasil diperbarui',
            'booking' => $booking->load('room', 'user'),
        ]);
    }

    // Export bookings to CSV / Excel compatible
    public function export(Request $request)
    {
        $query = Booking::with('user', 'room')->orderBy('booking_date', 'desc');

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->room_id) {
            $query->where('room_id', $request->room_id);
        }
        if ($request->start_date && $request->end_date) {
            $query->whereBetween('booking_date', [$request->start_date, $request->end_date]);
        }

        $bookings = $query->get();

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="Laporan_Reservasi_MeetMe_' . date('Ymd_His') . '.csv"',
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $callback = function () use ($bookings) {
            $file = fopen('php://output', 'w');
            // Write UTF-8 BOM so Excel opens indonesian characters properly
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // CSV Columns
            fputcsv($file, [
                'ID Reservasi',
                'PIN Check-In',
                'Tanggal Rapat',
                'Jam Mulai',
                'Jam Selesai',
                'Durasi (Jam)',
                'Nama Ruangan',
                'Lokasi Ruangan',
                'Nama Pemesan',
                'Jabatan',
                'Email',
                'Nomor Telepon',
                'Status Booking',
                'Status Check-In',
                'Agenda Rapat',
                'Peralatan Tambahan',
                'Konsumsi Rapat',
                'Alasan Pembatalan',
            ]);

            foreach ($bookings as $b) {
                // Parse equipment services
                $equipment = '';
                $catering = '';
                if ($b->services && is_array($b->services)) {
                    if (!empty($b->services['equipment']) && is_array($b->services['equipment'])) {
                        $equipment = implode(', ', $b->services['equipment']);
                    }
                    if (!empty($b->services['catering']) && is_array($b->services['catering'])) {
                        $pax = !empty($b->services['catering_pax']) ? " ({$b->services['catering_pax']} Pax)" : '';
                        $catering = implode(', ', $b->services['catering']) . $pax;
                    }
                }

                $statusLabel = match ($b->status) {
                    'confirmed' => 'Dikonfirmasi',
                    'pending'   => 'Menunggu',
                    'completed' => 'Selesai',
                    'cancelled' => 'Dibatalkan',
                    default     => $b->status,
                };

                $checkInStatus = $b->checked_in_at
                    ? 'Sudah Check-In (' . $b->checked_in_at->format('H:i d/m/Y') . ')'
                    : 'Belum Check-In';

                fputcsv($file, [
                    $b->id,
                    $b->check_in_code ?: '-',
                    $b->booking_date ? Carbon::parse($b->booking_date)->format('d/m/Y') : '-',
                    substr($b->start_time, 0, 5),
                    substr($b->end_time, 0, 5),
                    $b->duration_hours,
                    $b->room?->name ?: '-',
                    $b->room?->location ?: '-',
                    $b->user?->name ?: '-',
                    $b->user?->position ?: '-',
                    $b->user?->email ?: '-',
                    $b->user?->phone ?: '-',
                    $statusLabel,
                    $checkInStatus,
                    $b->notes ?: '-',
                    $equipment ?: '-',
                    $catering ?: '-',
                    $b->cancellation_reason ?: '-',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    // Tablet Kiosk Door Display status
    public function roomDisplay($roomId)
    {
        $room = Room::findOrFail($roomId);
        $today = Carbon::today()->format('Y-m-d');
        $nowTime = Carbon::now()->format('H:i:s');

        // Today's bookings
        $todayBookings = Booking::with('user')
            ->where('room_id', $roomId)
            ->where('booking_date', $today)
            ->whereNotIn('status', ['cancelled'])
            ->orderBy('start_time', 'asc')
            ->get();

        // Current ongoing meeting
        $currentBooking = $todayBookings->first(function ($b) use ($nowTime) {
            return $b->start_time <= $nowTime && $b->end_time >= $nowTime;
        });

        // Next upcoming meeting
        $nextBooking = $todayBookings->first(function ($b) use ($nowTime) {
            return $b->start_time > $nowTime;
        });

        return response()->json([
            'room'            => $room,
            'current_time'    => $nowTime,
            'is_occupied'     => !is_null($currentBooking),
            'current_booking' => $currentBooking,
            'next_booking'    => $nextBooking,
            'today_bookings'  => $todayBookings,
        ]);
    }

    // Instant Quick Book from Tablet Kiosk (30 or 60 minutes)
    public function quickBook(Request $request, $roomId)
    {
        $room = Room::findOrFail($roomId);

        if (!$room->is_available) {
            return response()->json(['message' => 'Ruangan tidak tersedia'], 422);
        }

        $durationMinutes = (int) $request->get('duration', 30);
        if (!in_array($durationMinutes, [15, 30, 45, 60])) {
            $durationMinutes = 30;
        }

        $now = Carbon::now();
        $today = $now->format('Y-m-d');
        $startTime = $now->format('H:i:00');
        $endTime = $now->copy()->addMinutes($durationMinutes)->format('H:i:00');

        // Check conflict
        $conflict = Booking::where('room_id', $roomId)
            ->where('booking_date', $today)
            ->whereNotIn('status', ['cancelled'])
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where('start_time', '<', $endTime)
                  ->where('end_time', '>', $startTime);
            })->first();

        if ($conflict) {
            return response()->json([
                'message' => 'Ruangan tidak dapat dipesan kilat karena ada jadwal rapat lain pada rentang waktu ini.',
            ], 422);
        }

        $user = $request->user() ?: User::where('role', 'admin')->first() ?: User::first();

        $booking = Booking::create([
            'user_id'        => $user->id,
            'room_id'        => $roomId,
            'booking_date'   => $today,
            'start_time'     => substr($startTime, 0, 5),
            'end_time'       => substr($endTime, 0, 5),
            'duration_hours' => round($durationMinutes / 60, 1),
            'total_price'    => 0,
            'status'         => 'confirmed',
            'checked_in_at'  => now(), // auto checked in from door tablet
            'check_in_code'  => strtoupper(Str::random(6)),
            'notes'          => '⚡ Rapat Kilat Spontan dari Layar Pintu (' . $durationMinutes . ' Menit)',
        ]);

        return response()->json([
            'message' => "Rapat kilat ({$durationMinutes} menit) berhasil dimulai!",
            'booking' => $booking->load('room', 'user'),
        ], 201);
    }
}
