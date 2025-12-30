globalThis.joinState = {};
globalThis.leaveState = {};

globalThis.playerDataByDbId = {};
globalThis.playerDataByName = {};

// strongly interruption-safe "onPlayerJoin" code
PT.join = (playerId) => {
  let cache = joinState[playerId];
  if (!cache) {
    cache = joinState[playerId] = { phase: 1 };
  }
  if (cache.phase === 1) {
    const dbid = PT.id_to_dbid[playerId];
    playerDataByDbId[dbid] = { /* init data */ };
    cache.phase === 2;
  }
  if (cache.phase === 2) {
    const name = PT.id_to_name[playerId];
    playerDataByName[name] = { /* init data */ };
    cache.phase === 3;
  }
  delete joinState[playerId];
};

// strongly interruption-safe "onPlayerLeave" code
PT.leave = (playerId) => {
  let cache = leaveState[playerId];
  if (!cache) {
    cache = leaveState[playerId] = { phase: 1 };
  }
  if (cache.phase === 1) {
    delete playerDataByDbId[PT.id_to_dbid[playerId]];
    cache.phase === 2;
  }
  if (cache.phase === 2) {
    delete playerDataByName[PT.id_to_name[playerId]];
    cache.phase === 3;
  }
  delete leaveState[playerId];
};

onPlayerJoin = (playerId) => {
  PT.onPlayerJoin(playerId);
};

onPlayerLeave = (playerId) => {
  PT.onPlayerLeave(playerId);
};

tick = () => {
  PT.tick();
};
