import { Link, useLocation, Navigate } from 'react-router-dom';

export default function RegistrationSummary() {
  const { state } = useLocation();
  const roomType = state?.roomType;
  const price = state?.price;
  const savedToServer = state?.savedToServer !== false;
  const notSavedReason = state?.notSavedReason;

  if (!roomType || price == null) {
    return <Navigate to="/register" replace />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Registration Summary
          </h1>
          <p className="text-slate-300 text-sm">
            {savedToServer
              ? 'Your room registration request has been submitted.'
              : 'Summary of your selection. Request was not saved to the server.'}
          </p>
        </div>

        {!savedToServer && (
          <div className="mb-6 p-3 rounded-lg text-sm bg-amber-500/20 border border-amber-400/40 text-amber-100">
            {notSavedReason || 'Request could not be saved.'} For the admin to see your request, ensure the backend is running and your account is linked to a student record, then try again from Register.
          </div>
        )}

        <dl className="space-y-5 mb-8">
          <div>
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Selected room type
            </dt>
            <dd className="text-lg font-semibold text-white">{roomType}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Price per year
            </dt>
            <dd className="text-lg font-semibold text-white">
              ₹{Number(price).toLocaleString()}/year
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              Status
            </dt>
            <dd className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-500/30 text-amber-200 border border-amber-400/40 text-sm font-medium">
              Pending admin approval
            </dd>
          </div>
        </dl>

        <p className="text-slate-300 text-sm border-t border-white/10 pt-6 mb-6">
          Payment module to be integrated in future phase.
        </p>

        <Link
          to="/dashboard"
          className="block w-full py-3 rounded-lg font-semibold text-white text-center bg-white/20 hover:bg-white/30 border border-white/30 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
