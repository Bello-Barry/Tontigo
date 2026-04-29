// Script pour simuler un callback MTN MoMo localement

async function simulateCollectionCallback(referenceId, status = 'SUCCESSFUL') {
  console.log(`Simulating callback for reference: ${referenceId}...`);
  
  const payload = {
    externalId: referenceId,
    amount: "500",
    currency: "EUR",
    status: status,
    financialTransactionId: "SIM-" + Math.random().toString(36).substr(2, 9)
  };

  try {
    const response = await fetch('http://localhost:3000/api/momo/callback/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Response from server:', data);
  } catch (err) {
    console.error('Error simulating callback:', err);
  }
}

// Récupérer le referenceId depuis les arguments de la ligne de commande
const refId = process.argv[2];
if (!refId) {
  console.log('Usage: node test-webhook.js <referenceId>');
  process.exit(1);
}

simulateCollectionCallback(refId);
