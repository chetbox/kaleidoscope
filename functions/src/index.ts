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
    return null;

  const randomWaitingUid = uidsWaiting[Math.floor(Math.random() * uidsWaiting.length)];
  console.log('selected', randomWaitingUid);

  await database.ref('/connection').child(randomWaitingUid).child('watching').set(myUid);
  return randomWaitingUid;
});

export const countConnections = functions.database.ref('/connection').onWrite(async event => {
  const connections = event.after.val() || {} as Connections;
  const count = Object.keys(connections).length;
  await database.ref('/stats').child('connections').child('count').set(count);
});
