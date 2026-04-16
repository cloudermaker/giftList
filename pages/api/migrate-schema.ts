/**
 * Script pour exécuter la migration SQL via Next.js
 * Utilise la connexion DB qui fonctionne déjà dans l'app
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  
  // Simple protection
  if (password !== 'migration2026') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🚀 Démarrage de la migration du schéma...\n');
    
    // Lire le fichier SQL
    const sqlPath = join(process.cwd(), 'migration', 'add_modern_schema.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');
    
    // Nettoyer le SQL: supprimer les commentaires et lignes vides
    const cleanedSql = sqlContent
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && 
               !trimmed.startsWith('--') && 
               !trimmed.includes('==================================================');
      })
      .join('\n');
    
    // Séparer par les points-virgules (en préservant ceux dans les strings)
    const sqlCommands = cleanedSql
      .split(/;(?=(?:[^']*'[^']*')*[^']*$)/) // Split sur ; sauf dans les strings
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    console.log(`📝 ${sqlCommands.length} commandes SQL à exécuter\n`);
    
    const results = [];
    
    // Exécuter chaque commande
    for (let i = 0; i < sqlCommands.length; i++) {
      const cmd = sqlCommands[i];
      
      try {
        const preview = cmd.substring(0, 80).replace(/\s+/g, ' ');
        console.log(`[${i + 1}/${sqlCommands.length}] ${preview}...`);
        
        await prisma.$executeRawUnsafe(cmd + ';');
        
        results.push({
          index: i + 1,
          status: 'success',
          preview
        });
        
        console.log(`    ✅ Succès`);
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        const preview = cmd.substring(0, 80).replace(/\s+/g, ' ');
        
        if (errorMsg.includes('already exists') || errorMsg.includes('duplicate key')) {
          console.log(`    ⚠️ Déjà existant (ignoré)`);
          results.push({
            index: i + 1,
            status: 'skipped',
            preview,
            reason: 'Already exists'
          });
        } else {
          console.log(`    ❌ Erreur: ${errorMsg.substring(0, 100)}`);
          results.push({
            index: i + 1,
            status: 'error',
            preview,
            error: errorMsg.substring(0, 200)
          });
        }
      }
    }
    
    console.log('\n✅ Migration du schéma terminée!\n');
    
    // Statistiques
    const stats = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length
    };
    
    console.log('📊 Statistiques:');
    console.log(`   ✅ Succès: ${stats.success}`);
    console.log(`   ⚠️ Ignorées: ${stats.skipped}`);
    console.log(`   ❌ Erreurs: ${stats.errors}`);
    
    return res.status(200).json({
      success: true,
      message: 'Migration schema completed',
      stats,
      results
    });
    
  } catch (error) {
    console.error('\n❌ Erreur fatale lors de la migration:', error);
    return res.status(500).json({ 
      success: false,
      error: String(error) 
    });
  } finally {
    await prisma.$disconnect();
  }
}
