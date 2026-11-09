<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'room_id',
        'booking_date',
        'start_time',
        'end_time',
        'duration_hours',
        'total_price',
        'status',
        'notes',
        'calendar_event_id',
        'meeting_file',
        'meeting_file_name',
        'attendees',
        'services',
        'check_in_code',
        'checked_in_at',
        'cancellation_reason',
        'recurring_group_id',
    ];

    protected $casts = [
        'booking_date'  => 'date',
        'total_price'   => 'decimal:2',
        'attendees'     => 'array',
        'services'      => 'array',
        'checked_in_at' => 'datetime',
    ];

    protected $appends = [
        'meeting_file_url',
        'qr_code_url',
        'is_checked_in',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function getMeetingFileUrlAttribute(): ?string
    {
        if ($this->meeting_file) {
            return url('storage/' . $this->meeting_file);
        }
        return null;
    }

    public function getIsCheckedInAttribute(): bool
    {
        return !is_null($this->checked_in_at);
    }

    public function getQrCodeUrlAttribute(): string
    {
        $code = $this->check_in_code ?: ('MM' . str_pad($this->id, 4, '0', STR_PAD_LEFT));
        $checkInPayload = url("/check-in?code={$code}&booking_id={$this->id}");
        return 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=' . urlencode($checkInPayload);
    }
}
