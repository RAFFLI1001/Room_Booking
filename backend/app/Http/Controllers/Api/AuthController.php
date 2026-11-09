<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone'    => 'nullable|string|max:20',
            'position' => 'nullable|string|max:100',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone'    => $validated['phone'] ?? null,
            'position' => $validated['position'] ?? null,
            'role'     => 'user',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil',
            'user'    => $user,
            'token'   => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'user'    => $user,
            'token'   => $token,
        ]);
    }

    public function googleLogin(Request $request)
    {
        $googleUser = null;

        // 1. If Google ID token 'credential' is provided (from Google Identity Services)
        if ($request->credential) {
            $parts = explode('.', $request->credential);
            if (count($parts) === 3) {
                $payloadJson = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1]));
                $payload = json_decode($payloadJson, true);
                if ($payload && isset($payload['email'])) {
                    $googleUser = [
                        'email'     => $payload['email'],
                        'name'      => $payload['name'] ?? explode('@', $payload['email'])[0],
                        'google_id' => $payload['sub'] ?? null,
                        'avatar'    => $payload['picture'] ?? null,
                    ];
                }
            }
        }

        // 2. Direct payload fallback (from OAuth popup, client SDK, or demo Google sign-in)
        if (!$googleUser && $request->email) {
            $request->validate([
                'email' => 'required|email',
                'name'  => 'nullable|string',
            ]);

            $googleUser = [
                'email'     => $request->email,
                'name'      => $request->name ?: explode('@', $request->email)[0],
                'google_id' => $request->google_id ?: null,
                'avatar'    => $request->avatar ?: null,
            ];
        }

        if (!$googleUser || empty($googleUser['email'])) {
            return response()->json([
                'message' => 'Autentikasi Google gagal. Data akun tidak ditemukan.',
            ], 422);
        }

        // Find or create user
        $user = User::where('email', $googleUser['email'])->first();

        if ($user) {
            $updates = [];
            if (!$user->google_id && !empty($googleUser['google_id'])) {
                $updates['google_id'] = $googleUser['google_id'];
            }
            if (!$user->avatar && !empty($googleUser['avatar'])) {
                $updates['avatar'] = $googleUser['avatar'];
            }
            if (!empty($updates)) {
                $user->update($updates);
            }
        } else {
            $user = User::create([
                'name'              => $googleUser['name'],
                'email'             => $googleUser['email'],
                'password'          => Hash::make(\Illuminate\Support\Str::random(24)),
                'role'              => 'user',
                'avatar'            => $googleUser['avatar'] ?? null,
                'google_id'         => $googleUser['google_id'] ?? null,
                'email_verified_at' => now(),
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login dengan akun Google berhasil',
            'user'    => $user,
            'token'   => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout berhasil']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function users(Request $request)
    {
        $query = User::select('id', 'name', 'email', 'phone', 'role', 'avatar', 'position');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        return response()->json($query->limit(50)->get());
    }

    public function saveGoogleConfig(Request $request)
    {
        $request->validate([
            'client_id' => 'required|string',
        ]);

        $clientId = trim($request->client_id);
        $envPath = base_path('../frontend/.env');

        if (file_exists($envPath)) {
            $content = file_get_contents($envPath);
            if (preg_match('/^VITE_GOOGLE_CLIENT_ID=.*$/m', $content)) {
                $content = preg_replace('/^VITE_GOOGLE_CLIENT_ID=.*$/m', 'VITE_GOOGLE_CLIENT_ID=' . $clientId, $content);
            } else {
                $content .= "\nVITE_GOOGLE_CLIENT_ID=" . $clientId;
            }
            file_put_contents($envPath, $content);
        }

        return response()->json([
            'message'   => 'Google Client ID berhasil disimpan ke sistem',
            'client_id' => $clientId,
        ]);
    }
}
