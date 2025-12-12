"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Wrapper from "@/app/components/Wrapper";

export default function AdminVerifyPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();

  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // -------------------------------------------------------
  // 🔥 LOGIQUE DE REDIRECTION CENTRALISÉE
  // -------------------------------------------------------
  useEffect(() => {
    if (status === "loading") return;

    if (status !== "authenticated" || !user) {
      router.push("/sign-in");
      return;
    }

    // Si admin → accès direct
    if (user.isAdmin) {
      router.push("/admin/dashboard");
      return;
    }

    // Si non admin mais approuvé → dashboard normal
    if (user.isApproved) {
      router.push("/dashboard");
      return;
    }

    // Sinon → afficher la page permettant d’entrer la clé admin
  }, [status, user, router]);

  // -------------------------------------------------------
  // 🔥 SOUMISSION DE LA CLÉ SECRÈTE ADMIN
  // -------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretKey }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Clé incorrecte");
      }
    } catch (error) {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // LOADING SPINNER
  // -------------------------------------------------------
  if (status === "loading" || !session || !user) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Wrapper>
    );
  }

  // -------------------------------------------------------
  // 🔥 AFFICHAGE DU FORMULAIRE POUR AJOUTER UN ADMIN
  // -------------------------------------------------------
  return (
    <Wrapper>
      <div className="max-w-2xl mx-auto mt-8 space-y-6">
        {/* Message d'attente d'approbation */}
        <div className="alert alert-warning shadow-lg">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-bold text-lg">Compte en attente d&apos;approbation</h3>
              <div className="text-sm mt-2">
                <p>Votre compte a été créé avec succès.</p>
                <p className="mt-1">Un administrateur doit maintenant :</p>
                <ul className="list-disc list-inside mt-2 ml-4">
                  <li>Approuver votre compte</li>
                  <li>Vous attribuer un rôle</li>
                  <li>Vous rattacher à un ministère</li>
                </ul>
                <p className="mt-2 font-medium">
                  Veuillez patienter ou contacter votre administrateur système.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Informations du compte */}
        {user && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Informations de votre compte</h2>
              <div className="space-y-2">
                <p><strong>Email :</strong> {user.email}</p>
                <p><strong>Nom :</strong> {user.name}</p>
                <p>
                  <strong>Statut :</strong>
                  <span className="badge badge-warning ml-2">En attente d&apos;approbation</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section Admin - Formulaire clé secrète */}
        <div className="divider">OU</div>
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl font-bold mb-2">
              Êtes-vous administrateur ?
            </h2>

            <p className="text-sm text-base-content/70 mb-4">
              Si vous disposez de la clé de sécurité administrateur, vous pouvez accéder immédiatement aux fonctionnalités d&apos;administration.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium">Clé de sécurité administrateur</span>
                </label>
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="Entrez la clé secrète admin"
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/50">
                    Contactez l&apos;administrateur système pour obtenir cette clé
                  </span>
                </label>
              </div>

              {error && (
                <div className="alert alert-error">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !secretKey}
                className={`btn btn-primary w-full ${loading ? "loading" : ""}`}
              >
                {loading ? "Vérification..." : "Devenir administrateur"}
              </button>
            </form>
          </div>
        </div>

        {/* Bouton retour */}
        <div className="text-center">
          <button
            onClick={() => {
              window.location.href = '/api/auth/signout';
            }}
            className="btn btn-ghost btn-sm"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </Wrapper>
  );
}
