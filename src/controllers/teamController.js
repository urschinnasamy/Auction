import * as Team from "../models/teamModel.js";

// CREATE TEAM
export const createTeam = async (req, res) => {
  try {
    const { tournament_id, user_id, team_name, team_logo } = req.body;
    
    // Validate required fields
    if (!tournament_id || !user_id || !team_name) {
      return res.status(400).json({
        success: false,
        msg: "Missing required fields: tournament_id, user_id, team_name"
      });
    }
    
    const team = await Team.createTeam({
      tournament_id: parseInt(tournament_id),
      user_id: parseInt(user_id),
      team_name,
      team_logo: team_logo || null,
    });

    res.status(201).json({
      success: true,
      data: team,
      message: `Team "${team.team_name}" created successfully! Budget: ₹${team.allocated_budget?.toLocaleString()}`
    });
  } catch (err) {
    console.log("🔥 CREATE TEAM ERROR:", err);
    
    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

// GET TEAMS BY TOURNAMENT
export const getTeamsByTournament = async (req, res) => {
  try {
    const { tournament_id } = req.query;

    if (!tournament_id) {
      return res.status(400).json({
        success: false,
        msg: "tournament_id is required"
      });
    }

    const teams = await Team.getTeamsByTournament(parseInt(tournament_id));

    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (err) {
    console.log("🔥 GET TEAMS ERROR:", err);

    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

// GET TEAM BY ID
export const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.getTeamById(parseInt(id));

    if (!team) {
      return res.status(404).json({
        success: false,
        msg: "Team not found"
      });
    }

    res.json({
      success: true,
      data: team
    });
  } catch (err) {
    console.log("🔥 GET TEAM ERROR:", err);

    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

// DELETE TEAM
export const deleteTeam = async (req, res) => {
  try {
    const result = await Team.deleteTeam(parseInt(req.params.id));

    res.json({
      success: true,
      msg: result.msg,
      returned_budget: result.returned_budget
    });
  } catch (err) {
    console.log("🔥 DELETE TEAM ERROR:", err);

    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

// GET TEAM BUDGET INFO
export const getTeamBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Team.getTeamBudgetInfo(parseInt(id));

    if (!budget) {
      return res.status(404).json({
        success: false,
        msg: "Team not found"
      });
    }

    res.json({
      success: true,
      data: budget
    });
  } catch (err) {
    console.log("🔥 GET TEAM BUDGET ERROR:", err);

    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

// GET ALL TEAMS WITH BUDGET INFO FOR TOURNAMENT
export const getAllTeamsWithBudget = async (req, res) => {
  try {
    const { tournament_id } = req.params;
    const teams = await Team.getAllTeamsWithBudget(parseInt(tournament_id));

    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (err) {
    console.log("🔥 GET ALL TEAMS WITH BUDGET ERROR:", err);

    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};