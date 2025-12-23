// Copyright (c) 2025 delfineonx
// This product includes "Player Tracker" created by delfineonx.
// Licensed under the Apache License, Version 2.0.

{
  const _PT = {
    scanIntervalTicks: 20,
    maxDequeuePerTick: 40,

    join: () => { },
    leave: () => { },

    forceScan: null,
    checkValid: null,
    getPlayerIds: null,

    onPlayerJoin: null,
    onPlayerLeave: null,
    tick: null,
  };

  // playerId -> [joinStatus, joinCache, leaveStatus, leaveCache, seenGenerationId]
  const _stateById = Object.create(null);
  const _presentIds = [];
  const _presentById = _PT.checkValid = Object.create(null);

  let _generationId = 1;
  let _scanCountdown = 0;

  _PT.getPlayerIds = () => _presentIds.slice();

  _PT.forceScan = () => {
    _scanCountdown = 0;
  };

  _PT.onPlayerJoin = (playerId) => {
    const state = _stateById[playerId] = [1, {}, 1, {}, _generationId + 1];

    if (!_presentById[playerId]) {
      const index = _presentIds.length;
      _presentIds[index] = playerId;
      _presentById[playerId] = index + 1;
    }

    if (state[0]) {
      try {
        _PT.join(playerId, state[1]);
        state[0] = 0;
      } catch (error) {
        state[0] = 0;
        api.broadcastMessage("Player Tracker: Join handler error: " + error.name + ": " + error.message, { color: "#ff9d87" });
      }
    }
  };

  _PT.onPlayerLeave = (playerId) => {
    const mapIndex = _presentById[playerId];
    const state = _stateById[playerId];

    if (!mapIndex) {
      if (state) {
        delete _stateById[playerId];
      }
      return;
    }

    if (state[2]) {
      try {
        _PT.leave(playerId, state[3]);
        state[2] = 0;
      } catch (error) {
        state[2] = 0;
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
  };

  _PT.tick = () => {
    if (_scanCountdown > 0) {
      _scanCountdown--;
      return;
    }

    const nextGenerationId = _generationId + 1;

    const newPlayerIds = api.getPlayerIds();
    const scanLength = newPlayerIds.length;
    let scanIndex = 0;
    while (scanIndex < scanLength) {
      const playerId = newPlayerIds[scanIndex];
      let state = _stateById[playerId];
      if (!state) {
        state = _stateById[playerId] = [1, {}, 1, {}, 0];
      }
      if (!_presentById[playerId]) {
        const index = _presentIds.length;
        _presentIds[index] = playerId;
        _presentById[playerId] = index + 1;
      }
      if (!state[2]) {
        state[0] = 1;
        state[1] = {};
        state[2] = 1;
        state[3] = {};
      }
      state[4] = nextGenerationId;
      scanIndex++;
    }

    let budget = _PT.maxDequeuePerTick;
    let presentIndex = 0;
    while (presentIndex < _presentIds.length && budget > 0) {
      const playerId = _presentIds[presentIndex];
      const state = _stateById[playerId];

      if (state[4] === nextGenerationId) {
        if (state[0]) {
          try {
            _PT.join(playerId, state[1]);
            state[0] = 0;
          } catch (error) {
            state[0] = 0;
            api.broadcastMessage("Player Tracker: Join handler error: " + error.name + ": " + error.message, { color: "#ff9d87" });
          }
          budget--;
        }
        presentIndex++;
        continue;
      }

      if (state[2]) {
        try {
          _PT.leave(playerId, state[3]);
          state[2] = 0;
        } catch (error) {
          state[2] = 0;
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

      budget--;
    }

    _generationId = nextGenerationId;
    _scanCountdown = (_PT.scanIntervalTicks - 1) * +(budget > 0);
  };

  Object.seal(_PT);
  globalThis.PT = _PT;
}

