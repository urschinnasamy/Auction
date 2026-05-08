import * as Player from "../models/playerModel.js";

// GET ALL
export const getPlayers = async (req, res) => {
  try {
    const players = await Player.getAllPlayers();
    res.json(players);
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
};

// CREATE
export const createNewPlayer = async (req, res) => {
  try {
    const player = await Player.createPlayer(req.body);

    res.status(201).json(player);
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
};

// UPDATE
export const updateExistingPlayer = async (req, res) => {
  try {
    const updated = await Player.updatePlayer(
      req.params.id,
      req.body
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
};

// DELETE
export const deleteExistingPlayer = async (req, res) => {
  try {
    await Player.deletePlayer(req.params.id);

    res.json({
      msg: "Player deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
};

// DELETE ALL
export const deleteAllPlayersController = async (req, res) => {
  try {
    await Player.deleteAllPlayers();

    res.json({
      msg: "All players deleted",
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
};

// BULK UPLOAD
export const bulkUploadPlayersController = async (
  req,
  res
) => {
  try {
    const players = req.body.players;

    await Player.bulkInsertPlayers(players);

    res.json({
      msg: "Players uploaded successfully",
      count: players.length,
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
};