<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Get all users with stats and filter options
     */
    public function index(Request $request)
    {
        $query = User::withCount('bookings');

        // Search query
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');

        if (in_array($sortBy, ['name', 'created_at', 'bookings_count', 'position'])) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest();
        }

        $perPage = (int) $request->get('per_page', 50);
        $users = $query->paginate($perPage);

        // Global stats for quick summary cards
        $stats = [
            'total_users'     => User::count(),
            'total_admins'    => User::where('role', 'admin')->count(),
            'total_employees' => User::where('role', 'user')->count(),
            'google_users'    => User::whereNotNull('google_id')->count(),
            'total_bookings'  => Booking::count(),
        ];

        return response()->json([
            'users' => $users,
            'stats' => $stats,
        ]);
    }

    /**
     * Get detailed data of a single user along with their booking history
     */
    public function show($id)
    {
        $user = User::withCount('bookings')
            ->with(['bookings' => function ($q) {
                $q->with('room')->latest();
            }])
            ->findOrFail($id);

        return response()->json([
            'user' => $user,
        ]);
    }

    /**
     * Update user data (Name, Email, Phone, Position, Role)
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone'    => 'nullable|string|max:30',
            'position' => 'nullable|string|max:100',
            'role'     => 'required|in:admin,user',
        ]);

        // Safety: Prevent admin from demoting themselves
        if ($user->id === $request->user()->id && $validated['role'] !== 'admin') {
            return response()->json([
                'message' => 'Anda tidak dapat mencabut hak administrator pada akun Anda sendiri.',
            ], 422);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Data pengguna berhasil diperbarui',
            'user'    => $user->fresh()->loadCount('bookings'),
        ]);
    }

    /**
     * Delete a user
     */
    public function destroy(Request $request, User $user)
    {
        // Safety: Prevent admin from deleting themselves
        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], 422);
        }

        $userName = $user->name;
        $user->delete();

        return response()->json([
            'message' => "Pengguna {$userName} berhasil dihapus.",
        ]);
    }
}
