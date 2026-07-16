import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

// Placeholder for pages/sections still backed by the disconnected Laravel
// API in this deployment — see src/lib/featureFlags.js and
// documentation/FEATURE_STATUS.md.
export default function ComingSoon({ feature = 'This feature' }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-cream">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ocean to-teal flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-heading font-semibold text-charcoal">Coming soon</h2>
          <p className="text-charcoal/60 leading-relaxed">
            {feature} isn't live in this deployment yet — we're still building it out.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-ocean to-teal rounded-lg hover:shadow-lg transition-all"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
