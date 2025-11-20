"use client"
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface AdminStatus {
  isAdmin: boolean;
  loading: boolean;
  userApproved: boolean;
}

export function useAdminStatus(): AdminStatus {
  const { data: session, status } = useSession();
  const [adminStatus, setAdminStatus] = useState<AdminStatus>({
    isAdmin: false,
    loading: true,
    userApproved: false
  });

  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      if (status === 'loading') {
        return;
      }

      if (!session?.user) {
        if (isMounted) {
          setAdminStatus({
            isAdmin: false,
            loading: false,
            userApproved: false
          });
        }
        return;
      }

      try {
        // Récupérer les informations de l'utilisateur
        const userResponse = await fetch(`/api/user/${session.user.id}`);
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          
          if (isMounted) {
            setAdminStatus({
              isAdmin: userData.user?.isAdmin || false,
              loading: false,
              userApproved: userData.user?.isApproved || false
            });
          }
        } else {
          // Utiliser les données de la session
          if (isMounted) {
            setAdminStatus({
              isAdmin: session.user.isAdmin || false,
              loading: false,
              userApproved: session.user.isApproved || false
            });
          }
        }
      } catch (error) {
        console.error('Erreur vérification statut admin:', error);
        if (isMounted) {
          setAdminStatus({
            isAdmin: session.user.isAdmin || false,
            loading: false,
            userApproved: session.user.isApproved || false
          });
        }
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [session, status]);

  return adminStatus;
}
