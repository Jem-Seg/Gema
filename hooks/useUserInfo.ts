"use client"
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UserDetails {
  id: string;
  email: string;
  name: string;
  firstName: string;
  isAdmin: boolean;
  isApproved: boolean;
  role?: {
    id: string;
    name: string;
  };
  ministere?: {
    id: string;
    name: string;
    abreviation: string;
  };
  structure?: {
    id: string;
    name: string;
  };
}

interface UserInfo {
  user: UserDetails | null;
  loading: boolean;
  isApproved: boolean;
  isAdmin: boolean;
}

export function useUserInfo(): UserInfo {
  const { data: session, status } = useSession();
  const [userInfo, setUserInfo] = useState<UserInfo>({
    user: null,
    loading: true,
    isApproved: false,
    isAdmin: false
  });

  useEffect(() => {
    let isMounted = true;

    const fetchUserInfo = async () => {
      if (status === 'loading') {
        return;
      }

      if (!session?.user) {
        if (isMounted) {
          setUserInfo({
            user: null,
            loading: false,
            isApproved: false,
            isAdmin: false
          });
        }
        return;
      }

      try {
        // Récupérer les informations complètes de l'utilisateur depuis la base de données
        const response = await fetch(`/api/user/${session.user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (isMounted) {
            setUserInfo({
              user: data.user,
              loading: false,
              isApproved: data.user?.isApproved || false,
              isAdmin: data.user?.isAdmin || false
            });
          }
        } else {
          if (isMounted) {
            setUserInfo({
              user: null,
              loading: false,
              isApproved: session.user.isApproved || false,
              isAdmin: session.user.isAdmin || false
            });
          }
        }
      } catch (error) {
        console.error('Erreur récupération infos utilisateur:', error);
        if (isMounted) {
          setUserInfo({
            user: null,
            loading: false,
            isApproved: session.user.isApproved || false,
            isAdmin: session.user.isAdmin || false
          });
        }
      }
    };

    fetchUserInfo();

    return () => {
      isMounted = false;
    };
  }, [session, status]);

  return userInfo;
}
