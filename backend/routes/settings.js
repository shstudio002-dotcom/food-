const express = require('express');
const router = express.Router();
const GeoFence = require('../models/GeoFence');

// GET: Fetch existing geo-fence settings
router.get('/geofence', async (req, res) => {
  try {
    // Get the most recently updated or created geo-fence zone
    const zone = await GeoFence.findOne().sort({ updatedAt: -1 });
    
    if (!zone) {
      return res.status(404).json({ message: 'No geo-fence zone configured yet.' });
    }
    
    res.status(200).json(zone);
  } catch (err) {
    console.error('Error fetching geo-fence:', err);
    res.status(500).json({ error: 'Server error while fetching geo-fence settings.' });
  }
});

// PUT: Save or update geo-fence settings
router.put('/geofence', async (req, res) => {
  try {
    const { centerLat, centerLng, radiusMeters } = req.body;

    if (centerLat == null || centerLng == null || radiusMeters == null) {
      return res.status(400).json({ error: 'Missing required geo-fence parameters.' });
    }

    // Upsert: update the existing zone or create one if it doesn't exist yet
    let zone = await GeoFence.findOne();
    
    if (zone) {
      zone.centerLat = centerLat;
      zone.centerLng = centerLng;
      zone.radiusMeters = radiusMeters;
      await zone.save();
    } else {
      zone = await GeoFence.create({ centerLat, centerLng, radiusMeters });
    }

    res.status(200).json({ 
      message: 'Geo-fence successfully saved & synced!', 
      zone 
    });
  } catch (err) {
    console.error('Error saving geo-fence:', err);
    res.status(500).json({ error: 'Server error while saving geo-fence settings.' });
  }
});

module.exports = router;