<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        $query = Room::query();

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('location', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            });
        }

        if ($request->capacity) {
            $query->where('capacity', '>=', (int)$request->capacity);
        }

        if ($request->filled('is_available')) {
            $query->where('is_available', $request->boolean('is_available'));
        }

        $rooms = $query->latest()->paginate(12);

        return response()->json($rooms);
    }

    public function show(Room $room)
    {
        return response()->json($room->append('image_url'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string',
            'location'       => 'required|string|max:255',
            'capacity'       => 'required|integer|min:1',
            'price_per_hour' => 'nullable|numeric|min:0',
            'facilities'     => 'nullable|array',
            'facilities.*'   => 'string',
            'image'          => 'nullable|image|max:2048',
            'is_available'   => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('rooms', 'public');
        }

        $validated['price_per_hour'] = $validated['price_per_hour'] ?? 0;

        $room = Room::create($validated);

        return response()->json([
            'message' => 'Ruangan berhasil ditambahkan',
            'room'    => $room,
        ], 201);
    }

    public function update(Request $request, Room $room)
    {
        $validated = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'description'    => 'nullable|string',
            'location'       => 'sometimes|string|max:255',
            'capacity'       => 'sometimes|integer|min:1',
            'price_per_hour' => 'sometimes|numeric|min:0',
            'facilities'     => 'nullable|array',
            'facilities.*'   => 'string',
            'image'          => 'nullable|image|max:2048',
            'is_available'   => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            if ($room->image) {
                Storage::disk('public')->delete($room->image);
            }
            $validated['image'] = $request->file('image')->store('rooms', 'public');
        }

        $room->update($validated);

        return response()->json([
            'message' => 'Ruangan berhasil diperbarui',
            'room'    => $room->fresh()->append('image_url'),
        ]);
    }

    public function destroy(Room $room)
    {
        if ($room->image) {
            Storage::disk('public')->delete($room->image);
        }
        $room->delete();

        return response()->json(['message' => 'Ruangan berhasil dihapus']);
    }

    public function availability(Request $request, Room $room)
    {
        $request->validate([
            'date' => 'required|date|after_or_equal:today',
        ]);

        $bookings = Booking::where('room_id', $room->id)
            ->where('booking_date', $request->date)
            ->whereNotIn('status', ['cancelled'])
            ->with('user:id,name,position')
            ->get()
            ->map(function ($b) {
                return [
                    'id'            => $b->id,
                    'start_time'    => substr($b->start_time, 0, 5),
                    'end_time'      => substr($b->end_time, 0, 5),
                    'status'        => $b->status,
                    'notes'         => $b->notes,
                    'user_name'     => $b->user?->name ?? 'Karyawan',
                    'user_position' => $b->user?->position ?? 'Karyawan',
                ];
            });

        return response()->json([
            'room'     => $room->append('image_url'),
            'date'     => $request->date,
            'bookings' => $bookings,
        ]);
    }
}
