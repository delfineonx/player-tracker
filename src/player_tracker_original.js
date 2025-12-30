// Copyright (c) 2025 delfineonx
// This product includes "Player Tracker" created by delfineonx.
// Licensed under the Apache License, Version 2.0.

{
  const _PT = {
    join: () => { },
    leave: () => { },

    ids: null, // safe (copy)
    checkValid: Object.create(null),
    _playerIds: [], // unsafe (reference)

    id_to_name: Object.create(null), // "id" -> "Name"
    name_to_id: Object.create(null), // "Name" -> "id"
    id_to_dbid: Object.create(null), // "id" -> "DbId"
    dbid_to_id: Object.create(null), // "DbId" -> "id"

    positions: null,
    crouching: null,

    update: 0xffffffff,

    onPlayerJoin: null,
    onPlayerLeave: null,
    tick: null,
  };

  const _stateById = Object.create(null);  // "id" -> (32-2: seenGenerationId)(1-1: leaveStatus)(0-0: joinStatus)
  const _presentIds = _PT._playerIds; // ["id1", "id2", ...]
  const _presentById = _PT.checkValid; // "id" -> presentGeneration (integer > 0)
  const _positions = Object.create(null); // "id" -> [x, y, z]
  const _crouching = Object.create(null); // "id" -> false/true

  let _presentGeneration = 1;
  let _positionsUpdate = 1;
  let _crouchingUpdate = 1;

  const _IdToName = _PT.id_to_name;
  const _NameToId = _PT.name_to_id;
  const _IdToDbId = _PT.id_to_dbid;
  const _DbIdToId = _PT.dbid_to_id;

  const _getPlayerIds = api.getPlayerIds;
  const _getPosition = api.getPosition;
  const _isPlayerCrouching = api.isPlayerCrouching;

  _PT.ids = () => _presentIds.slice();

  _PT.positions = () => {
    if (_positionsUpdate) {
      let index = 0;
      const count = _presentIds.length;
      let playerId;
      while (index < count) {
        playerId = _presentIds[index];
        _positions[playerId] = _getPosition(playerId);
        index++;
      }
      _positionsUpdate = 0;
    }
    return _positions;
  };

  _PT.crouching = () => {
    if (_crouchingUpdate) {
      let index = 0;
      const count = _presentIds.length;
      let playerId;
      while (index < count) {
        playerId = _presentIds[index];
        _crouching[playerId] = _isPlayerCrouching(playerId);
        index++;
      }
      _crouchingUpdate = 0;
    }
    return _crouching;
  };

  _PT.onPlayerJoin = (playerId) => {
    let state = _stateById[playerId];
    if (state === undefined) { state = _stateById[playerId] = (3 >> 0); }
    if (state & 1) {
      try {
        const name = api.getEntityName(playerId);
        const dbid = api.getPlayerDbId(playerId);
        if (!_presentById[playerId]) {
          const index = _presentIds.length;
          _presentIds[index] = playerId;
          _presentById[playerId] = index + 1;
        }
        _IdToName[playerId] = name;
        _NameToId[name] = playerId;
        _IdToDbId[playerId] = dbid;
        _DbIdToId[dbid] = playerId;
        _positionsUpdate = 1;
        _crouchingUpdate = 1;
        _PT.update = 0xffffffff;
        _PT.join(playerId);
        _stateById[playerId] = state &= ~1;
      } catch (error) {
        _stateById[playerId] = state &= ~1;
        api.broadcastMessage("Player Tracker: Join handler error: " + error.name + ": " + error.message, { color: "#ff9d87" });
      }
    }
  };

  _PT.onPlayerLeave = (playerId) => {
    const mapIndex = _presentById[playerId];
    if (!mapIndex) {
      delete _stateById[playerId];
      return;
    }
    let state = (_stateById[playerId] >>> 0);
    if (state & 2) {
      try {
        _PT.leave(playerId);
        _stateById[playerId] = state &= ~2;
      } catch (error) {
        _stateById[playerId] = state &= ~2;
        api.broadcastMessage("Player Tracker: Leave handler error: " + error.name + ": " + error.message, { color: "#ff9d87" });
      }
    }
    const lastIndex = _presentIds.length - 1;
    const lastPlayerId = _presentIds[lastIndex];
    if (lastPlayerId !== playerId) {
      _presentIds[mapIndex - 1] = lastPlayerId;
      _presentById[lastPlayerId] = mapIndex;
    }
    _presentIds.length = lastIndex;
    delete _presentById[playerId];
    delete _stateById[playerId];
    const name = _IdToName[playerId];
    const dbid = _IdToDbId[playerId];
    delete _IdToName[playerId];
    delete _NameToId[name];
    delete _IdToDbId[playerId];
    delete _DbIdToId[dbid];
    delete _positions[playerId];
    delete _crouching[playerId];
    _positionsUpdate = 1;
    _crouchingUpdate = 1;
    _PT.update = 0xffffffff;
  };

  _PT.tick = () => {
    const newPlayerIds = _getPlayerIds();
    const scanLength = newPlayerIds.length;
    const nextPresentGen = _presentGeneration + 1;
    let scanIndex = 0, presentIndex = 0;
    let playerId, state;
    while (scanIndex < scanLength) {
      playerId = newPlayerIds[scanIndex];
      state = _stateById[playerId] ?? 3;
      if (!_presentById[playerId]) {
        const index = _presentIds.length;
        _presentIds[index] = playerId;
        _presentById[playerId] = index + 1;
      }
      if (!(state & 2)) { state = 3; }
      _stateById[playerId] = state = ((nextPresentGen << 2) | (state & 3));
      scanIndex++;
    }
    while (presentIndex < _presentIds.length) {
      playerId = _presentIds[presentIndex];
      state = _stateById[playerId];
      if ((state >>> 2) === nextPresentGen) {
        if (state & 1) {
          try {
            const name = api.getEntityName(playerId);
            const dbid = api.getPlayerDbId(playerId);
            _IdToName[playerId] = name;
            _NameToId[name] = playerId;
            _IdToDbId[playerId] = dbid;
            _DbIdToId[dbid] = playerId;
            _PT.join(playerId);
            _stateById[playerId] = state &= ~1;
          } catch (error) {
            _stateById[playerId] = state &= ~1;
            api.broadcastMessage("Player Tracker: Join handler error: " + error.name + ": " + error.message, { color: "#ff9d87" });
          }
        }
        presentIndex++;
        continue;
      }
      if (state & 2) {
        try {
          _PT.leave(playerId);
          _stateById[playerId] = state &= ~2;
        } catch (error) {
          _stateById[playerId] = state &= ~2;
          api.broadcastMessage("Player Tracker: Leave handler error: " + error.name + ": " + error.message, { color: "#ff9d87" });
        }
      }
      const lastIndex = _presentIds.length - 1;
      const lastPlayerId = _presentIds[lastIndex];
      if (lastIndex !== presentIndex) {
        _presentIds[presentIndex] = lastPlayerId;
        _presentById[lastPlayerId] = presentIndex + 1;
      }
      _presentIds.length = lastIndex;
      delete _presentById[playerId];
      delete _stateById[playerId];
      const name = _IdToName[playerId];
      const dbid = _IdToDbId[playerId];
      delete _IdToName[playerId];
      delete _NameToId[name];
      delete _IdToDbId[playerId];
      delete _DbIdToId[dbid];
      delete _positions[playerId];
      delete _crouching[playerId];
    }
    _positionsUpdate = 1;
    _crouchingUpdate = 1;
    _PT.update = 0xffffffff;
    _presentGeneration = nextPresentGen;
  };

  Object.seal(_PT);
  globalThis.PT = _PT;
  void 0
}

