import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const config = functions.config().firebase;
admin.initializeApp(config
  ? {
    databaseAuthVariableOverride: {
      uid: 'cloudfunction@kaleidoscope'
    },
    ...config
  }
  : config
);

const database = admin.database();

interface Connection {
  peerId: String;
  watching?: String;
}

type Connections = { [key: string]: Connection }

export const requestConnection = functions.https.onCall(async (data, context) => {
  const myUid = context.auth.uid;
  const connections = (await database.ref('/connection').once('value')).val() || {} as Connections;

  const uidsOnline = Object.keys(connections).filter(uid => uid !== myUid);
  const uidsWaiting = uidsOnline.filter(uid => !connections[uid].watching);
  console.log('candidates', uidsWaiting);

  if (uidsWaiting.length === 0)
    return;

  const randomWaitingUid = uidsWaiting[Math.floor(Math.random() * uidsWaiting.length)];
  console.log('selected', randomWaitingUid);

  return connections[randomWaitingUid];
});

export const countConnections = functions.https.onCall(async (data, context) => {
  const connections = (await database.ref('/connection').once('value')).val() || {} as Connections;
  return Object.keys(connections).length;
});
