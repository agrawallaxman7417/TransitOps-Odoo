// =====================================================================
// FILE: controllers/settingsController.js
// MODULE: CFG (Settings & RBAC — Screen 8)
// FUNCTIONS IN THIS FILE:
//   FN-CFG-01  getSettings       - get general depot settings
//   FN-CFG-02  saveSettings      - save general depot settings
// =====================================================================

const Settings = require("../models/Settings");
const AppError = require("../utils/AppError");

/**
 * FN-CFG-01 — getSettings
 * ------------------------------------------------------------------
 * WHAT IT DOES : Fetches the current settings document. If none exists,
 *                 creates a default settings document.
 * PAGE          : Settings (Screen 8)
 * INPUT         : none
 * OUTPUT        : 200 -> { settings }
 * SIDE EFFECTS  : Creates a default settings document if database is empty.
 * THROWS        : none expected
 * ------------------------------------------------------------------
 */
async function getSettings(req, res, next) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.status(200).json({ success: true, settings });
  } catch (err) {
    next(err);
  }
}

/**
 * FN-CFG-02 — saveSettings
 * ------------------------------------------------------------------
 * WHAT IT DOES : Saves general settings (depotName, currency, distanceUnit).
 * PAGE          : Settings (Screen 8)
 * INPUT         : req.body = { depotName, currency, distanceUnit }
 * OUTPUT        : 200 -> { settings }
 * SIDE EFFECTS  : Writes updates to Settings collection.
 * THROWS        : 400 [FN-CFG-02] saveSettings: "Missing required settings fields"
 * ------------------------------------------------------------------
 */
async function saveSettings(req, res, next) {
  try {
    const { depotName, currency, distanceUnit } = req.body;

    if (!depotName || !currency || !distanceUnit) {
      throw new AppError(400, "[FN-CFG-02] saveSettings: Missing required settings fields");
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    settings.depotName = depotName;
    settings.currency = currency;
    settings.distanceUnit = distanceUnit;
    await settings.save();

    res.status(200).json({ success: true, settings });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, saveSettings };
