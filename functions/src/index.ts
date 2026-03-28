import { database, initializeApp } from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onValueWritten } from 'firebase-functions/v2/database';

initializeApp({
  databaseAuthVariableOverride: {
    uid: 'cloudfunction@kaleidoscope'
  }
});

interface Connection {
  peerId: String;
  watching?: String;
}

type Connections = { [key: string]: Connection }

export const requestConnectionV2 = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  const myUid = request.auth.uid;
  const connections: Connections = (await database().ref('/connection').once('value')).val() || {};

  const uidsOnline = Object.keys(connections).filter(uid => uid !== myUid);
  const uidsWaiting = uidsOnline.filter(uid => !connections[uid].watching);
  console.log('candidates', uidsWaiting);

  if (uidsWaiting.length === 0)
    return null;

  const randomWaitingUid = uidsWaiting[Math.floor(Math.random() * uidsWaiting.length)];
  console.log('selected', randomWaitingUid);

  await database().ref('/connection').child(randomWaitingUid).child('watching').set(myUid);
  return randomWaitingUid;
});

export const countConnectionsV2 = onValueWritten('/connection', async (event) => {
  const connections = event.data.after.val() || {} as Connections;
  const count = Object.keys(connections).length;
  await database().ref('/stats').child('connections').child('count').set(count);
});
