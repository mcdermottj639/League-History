// Local-only preview: synthetic data and a non-production organizer capability.
import {createApp,hash} from '../server/app.mjs';
import {Store} from '../server/store.mjs';
import {seedPreview} from '../server/preview.mjs';
const store=new Store(':memory:');seedPreview(store);
const app=createApp({store,organizerHash:hash('preview-organizer-key-for-local-tests-1234567'),preview:true});
app.listen(Number(process.env.PORT||8787),'127.0.0.1',()=>console.log('Fixture preview listening on http://127.0.0.1:8787 (no production reads/writes).'));
