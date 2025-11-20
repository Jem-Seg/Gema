// Script pour promouvoir un utilisateur en administrateur
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function promoteToAdmin() {
  try {
    console.log("🔧 Promotion d'un utilisateur en administrateur...");
    
    const userEmail = "jem.mhamed@gmail.com";
    
    const promotedUser = await prisma.user.update({
      where: { 
        email: userEmail 
      },
      data: { 
        isAdmin: true,
        isApproved: true
      }
    });

    console.log("✅ Utilisateur promu avec succès !");
    console.log(`   Email: ${promotedUser.email}`);
    console.log(`   Nom: ${promotedUser.firstName} ${promotedUser.name}`);
    console.log(`   Admin: ${promotedUser.isAdmin ? "✅" : "❌"}`);
    console.log(`   Approuvé: ${promotedUser.isApproved ? "✅" : "❌"}`);
    console.log("🎉 Accès admin accordé !");

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

promoteToAdmin();
