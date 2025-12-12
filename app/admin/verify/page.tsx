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
      <div className="max-w-md mx-auto mt-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-2xl font-bold mb-4">
              Accès Administrateur
            </h1>

            <p className="text-sm text-base-content/70 mb-6">
              Pour accéder aux fonctionnalités d&apos;administration,
              veuillez entrer la clé de sécurité.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium">Clé de sécurité</span>
                </label>
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="Entrez la clé de sécurité"
                  required
                />
              </div>

              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !secretKey}
                className={`btn btn-primary w-full ${loading ? "loading" : ""
                  }`}
              >
                {loading ? "Vérification..." : "Vérifier"}
              </button>
            </form>

            <div className="text-center mt-4">
              <button
                onClick={() => router.push("/")}
                className="btn btn-ghost btn-sm"
              >
                Retour à l&apos;accueil
              </button>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
