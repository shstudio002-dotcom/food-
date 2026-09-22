const Offer = require('../models/Offer'); // 👈 Import the Offer model

// GET: Fetch the current live customer banner offer from MongoDB
router.get('/offers', async (req, res) => {
  try {
    let offer = await Offer.findOne();
    
    // If no offer exists in the database yet, create and return a default one
    if (!offer) {
      offer = await Offer.create({
        tag: 'FLAT 50% OFF',
        title: 'FLAT 50% OFF',
        subtitle: 'On your first 3 food orders!',
        speed: '30 Min',
        bgMedia: '',
        mediaType: ''
      });
    }

    res.json(offer);
  } catch (err) {
    console.error('Failed to fetch offer:', err);
    res.status(500).json({ error: 'Failed to fetch offer from database' });
  }
});

// PUT: Update / Save banner offer changes from the admin panel into MongoDB
router.put('/offers', async (req, res) => {
  try {
    console.log('📥 Incoming Offer Update Payload:', req.body);

    const { tag, title, subtitle, speed, bgMedia, mediaType } = req.body;

    // Find the single document or create one if it doesn't exist yet (Upsert)
    let updatedOffer = await Offer.findOne();

    if (!updatedOffer) {
      updatedOffer = await Offer.create({
        tag: tag || 'FLAT 50% OFF',
        title: title || 'FLAT 50% OFF',
        subtitle: subtitle || 'On your first 3 food orders!',
        speed: speed || '30 Min',
        bgMedia: bgMedia || '',
        mediaType: mediaType || ''
      });
    } else {
      updatedOffer.tag = tag !== undefined ? tag : updatedOffer.tag;
      updatedOffer.title = title !== undefined ? title : updatedOffer.title;
      updatedOffer.subtitle = subtitle !== undefined ? subtitle : updatedOffer.subtitle;
      updatedOffer.speed = speed !== undefined ? speed : updatedOffer.speed;
      updatedOffer.bgMedia = bgMedia !== undefined ? bgMedia : updatedOffer.bgMedia;
      updatedOffer.mediaType = mediaType !== undefined ? mediaType : updatedOffer.mediaType;

      await updatedOffer.save();
    }

    console.log('✅ Successfully updated Offer in MongoDB Atlas:', updatedOffer);
    res.json({ success: true, offer: updatedOffer });
  } catch (err) {
    console.error('❌ Failed to update offer:', err);
    res.status(500).json({ success: false, error: 'Failed to save offer update to database' });
  }
});