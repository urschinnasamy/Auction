import * as Tournament from "../models/tournamentModel.js";

// CREATE
export const createTournament = async (req, res) => {
  try {
    const tournament = await Tournament.createTournament(req.body);

    res.status(201).json(tournament);
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
};

// GET ALL
export const getAllTournaments = async (req, res) => {
  try {
    const tournaments =
      await Tournament.getAllTournaments();

    res.json(tournaments);
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
};

// GET ONE
export const getTournamentById = async (req, res) => {
  try {
    const tournament =
      await Tournament.getTournamentById(req.params.id);

    res.json(tournament);
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
};

// UPDATE
export const updateTournament = async (req, res) => {
  try {
    const tournament =
      await Tournament.updateTournament(
        req.params.id,
        req.body
      );

    res.json(tournament);
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
};

// DELETE
export const deleteTournament = async (req, res) => {
  try {
    await Tournament.deleteTournament(req.params.id);

    res.json({
      msg: "Tournament deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      msg: err.message,
    });
  }
};