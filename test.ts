import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

(async () => {
  try {
    const { requestToPay, getCollectionStatus } = require('./lib/momo/index');
    process.env.NODE_ENV = 'development';
    const ref = await requestToPay({ amount: 500, phone: '46733123453', externalId: 'test1234', payerMessage: 'test', payeeNote: 'test' });
    console.log('Reference:', ref);
    for (let i=0; i<10; i++) {
      const status = await getCollectionStatus(ref);
      console.log(`Status at ${i * 3}s:`, status.status);
      if (status.status !== 'PENDING') break;
      await new Promise(r => setTimeout(r, 3000));
    }
  } catch (err) {
    console.error('Error:', err);
  }
})();
