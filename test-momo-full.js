// 1. Charger l'environnement d'abord !
const fs = require('fs');
const envConfig = fs.readFileSync('.env.local', 'utf8').split('\n');
envConfig.forEach(line => {
  const parts = line.split('=');
  if(parts.length > 1) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    if(key && !key.startsWith('#')) {
      process.env[key] = val;
    }
  }
});

// 2. Importer la librairie après
const { requestToPay, getCollectionStatus, transfer, getDisbursementStatus } = require('./lib/momo/index.ts');
const crypto = require('crypto');

async function runFullTest() {
    console.log('🚀 Démarrage du test complet MTN MoMo Sandbox...\n');

    try {
        // 1. TEST COLLECTION (RequestToPay)
        console.log('--- Étape 1 : RequestToPay (Encaissement) ---');
        const phone = '46733123453'; // Numéro standard Sandbox
        const amount = 100;
        const externalId = 'TEST-' + Date.now();
        
        console.log(`Demande de ${amount} EUR pour le numéro ${phone}...`);
        const refId = await requestToPay({
            amount,
            phone,
            externalId,
            payerMessage: 'Test Tontigo Local',
            payeeNote: 'Merci'
        });
        console.log('✅ Requête acceptée ! Reference-Id:', refId);

        console.log('\nVérification du statut du paiement...');
        const status = await getCollectionStatus(refId);
        console.log('Statut actuel:', status.status); // Devrait être PENDING
        console.dir(status, { depth: null });

        console.log('\n--------------------------------------------\n');

        // 2. TEST DISBURSEMENT (Transfer)
        console.log('--- Étape 2 : Transfer (Décaissement) ---');
        console.log(`Envoi de ${amount} EUR vers le numéro ${phone}...`);
        const transferRefId = await transfer({
            amount,
            phone,
            externalId: 'WDR-' + Date.now(),
            payerMessage: 'Retrait Test',
            payeeNote: 'Tontigo'
        });
        console.log('✅ Transfert initié ! Reference-Id:', transferRefId);

        console.log('\nVérification du statut du transfert...');
        const transferStatus = await getDisbursementStatus(transferRefId);
        console.log('Statut actuel:', transferStatus.status);
        console.dir(transferStatus, { depth: null });

        console.log('\n🎉 TEST TERMINÉ AVEC SUCCÈS !');
        console.log('La communication avec MTN MoMo Sandbox est 100% opérationnelle.');

    } catch (error) {
        console.error('\n❌ ERREUR LORS DU TEST :', error.message);
        if (error.stack) console.error(error.stack);
    }
}

runFullTest();
