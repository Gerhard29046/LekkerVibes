<?php

namespace App\Providers;

use App\Models\Community;
use App\Models\Event;
use App\Models\Message;
use App\Models\User;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // This is a pure JSON API — never redirect unauthenticated
        // requests to a "login" route; let them fall through to the
        // AuthenticationException -> 401 JSON response instead.
        Authenticate::redirectUsing(fn () => null);

        // Password reset links point at the frontend's /reset-password
        // page (which posts token+email+password to
        // POST /api/auth/reset-password), not a Laravel-rendered view.
        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            $email = urlencode($notifiable->getEmailForPasswordReset());

            return config('app.frontend_url')."/reset-password?token={$token}&email={$email}";
        });

        // Short, stable morph aliases for polymorphic reportable/target
        // columns (reports.reportable_type, moderation_actions.target_type)
        // instead of leaking full namespaced class names into the API and
        // the database.
        Relation::enforceMorphMap([
            'user' => User::class,
            'event' => Event::class,
            'community' => Community::class,
            'message' => Message::class,
        ]);
    }
}
