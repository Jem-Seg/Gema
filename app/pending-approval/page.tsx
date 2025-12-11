export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
      <div className="card shadow-xl p-10 bg-base-100 max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">
          Votre compte est en attente de validation
        </h1>

        <p className="mb-6 text-gray-600">
          Un administrateur doit approuver votre compte avant que vous puissiez accéder à l'application.
        </p>

        <p className="text-sm text-gray-500">
          Merci de revenir plus tard.
        </p>
      </div>
    </div>
  );
}
