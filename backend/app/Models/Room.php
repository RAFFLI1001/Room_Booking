<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'description', 'location', 'capacity',
        'price_per_hour', 'facilities', 'image', 'is_available',
    ];

    protected $casts = [
        'facilities'     => 'array',
        'is_available'   => 'boolean',
        'price_per_hour' => 'decimal:2',
    ];

    protected $appends = ['image_url'];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($room) {
            $room->slug = Str::slug($room->name) . '-' . uniqid();
        });
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function getImageUrlAttribute(): string
    {
        if ($this->image) {
            if (str_starts_with($this->image, 'http://') || str_starts_with($this->image, 'https://')) {
                return $this->image;
            }
            return url('storage/' . $this->image);
        }

        // Default foto ruangan rapat kantor profesional & estetik
        $defaultImages = [
            'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
        ];

        $idx = $this->id ? (int)($this->id % count($defaultImages)) : 0;
        return $defaultImages[$idx];
    }
}
