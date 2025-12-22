const _playerIdData = globalThis.playerById = Object.create(null);
const _playerNameData = globalThis.playerByName = Object.create(null);
const _playerDbIdData = globalThis.playerByDbId = Object.create(null);

// strongly interruption-safe "onPlayerJoin" code
PT.join = (playerId, cache) => {
  const name = api.getEntityName(playerId);
  const dbid = api.getPlayerDbId(playerId);
  _playerIdData[playerId] = { name, dbid };
  _playerNameData[name] = { id: playerId, dbid };
  _playerDbIdData[dbid] = { id: playerId, name };
};

// strongly interruption-safe "onPlayerLeave" code
PT.leave = (playerId, cache) => {
  const data = _playerIdData[playerId];
  delete _playerNameData[data.name];
  delete _playerDbIdData[data.dbid];
  delete _playerIdData[playerId];
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
