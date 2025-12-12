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
        // Vérifier que l'ID existe et est valide
        const userId = (session.user as any).id;
        
        if (!userId) {
          console.warn('⚠️ useUserInfo: ID utilisateur manquant dans la session');
          if (isMounted) {
            setUserInfo({
              user: null,
              loading: false,
              isApproved: (session.user as any).isApproved || false,
              isAdmin: (session.user as any).isAdmin || false
            });
          }
          return;
        }

        console.log('🔍 useUserInfo: Récupération infos pour user ID:', userId);

        // Récupérer les informations complètes de l'utilisateur depuis la base de données
        const response = await fetch(`/api/user/${userId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('📥 useUserInfo: Response status:', response.status);
        
        if (response.ok) {
          // Log le texte brut avant de parser
          const responseText = await response.text();
          console.log('📄 useUserInfo: Response text brut (premiers 500 chars):', responseText.substring(0, 500));
          
          try {
            const data = JSON.parse(responseText);
            console.log('✅ useUserInfo: Données parsées avec succès');
            
            if (isMounted) {
              setUserInfo({
                user: data.user,
                loading: false,
                isApproved: data.user?.isApproved || false,
                isAdmin: data.user?.isAdmin || false
              });
            }
          } catch (parseError) {
            console.error('❌ useUserInfo: Erreur parsing JSON:', parseError);
            console.error('❌ useUserInfo: Type erreur:', parseError instanceof Error ? parseError.message : String(parseError));
            console.error('❌ useUserInfo: Contenu complet:', responseText);
            
            if (isMounted) {
              setUserInfo({
                user: null,
                loading: false,
                isApproved: (session.user as any).isApproved || false,
                isAdmin: (session.user as any).isAdmin || false
              });
            }
          }
        } else {
          console.warn('⚠️ useUserInfo: Response non-ok:', response.status);
          const errorText = await response.text();
          console.warn('⚠️ useUserInfo: Error body:', errorText);
          
          if (isMounted) {
            setUserInfo({
              user: null,
              loading: false,
              isApproved: (session.user as any).isApproved || false,
              isAdmin: (session.user as any).isAdmin || false
            });
          }
        }
      } catch (error) {
        console.error('❌ Erreur récupération infos utilisateur:', error);
        console.error('❌ Type erreur:', error instanceof Error ? error.message : String(error));
        
        if (isMounted) {
          setUserInfo({
            user: null,
            loading: false,
            isApproved: (session.user as any).isApproved || false,
            isAdmin: (session.user as any).isAdmin || false
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
