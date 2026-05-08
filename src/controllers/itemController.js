import * as Item from "../models/itemModel.js";

// create auction
export const createItem = async (req, res) => {
  try {
    const data = {
      ...req.body,
      userId: req.user.id,
    };

    const item = await Item.createItem(data);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// get all auctions
export const getItems = async (req, res) => {
  try {
    const items = await Item.getItems();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// get single auction
export const getItem = async (req, res) => {
  try {
    const item = await Item.getItemById(req.params.id);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};