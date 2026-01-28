import Pricing from './pricing.model.js';

// Create or Update pricing for a delivery method
export const setPrice = async (req, res) => {
  try {
    const { deliveryType, pageTiers = [], currency } = req.body;

    if (!deliveryType) {
      return res
        .status(400)
        .json({ success: false, error: 'deliveryType is required' });
    }

    // Normalize and keep only valid numeric tiers
    const normalizedTiers = Array.isArray(pageTiers)
      ? pageTiers
          .map((tier) => ({
            pageLimit: Number(tier?.pageLimit),
            price: Number(tier?.price)
          }))
          .filter(
            (tier) =>
              Number.isFinite(tier.pageLimit) && Number.isFinite(tier.price)
          )
          .sort((a, b) => a.pageLimit - b.pageLimit)
      : [];

    if (normalizedTiers.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          error: 'At least one page tier with pageLimit and price is required'
        });
    }

    // Use findOneAndUpdate with upsert: true to create if missing or update if exists
    const updatedPricing = await Pricing.findOneAndUpdate(
      { deliveryType },
      { pageTiers: normalizedTiers, currency: currency || 'usd' },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Price for ${deliveryType} updated successfully`,
      data: updatedPricing
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all set prices for the frontend dropdowns/selection
export const getAllPrices = async (req, res) => {
  try {
    const prices = await Pricing.find();
    res.status(200).json({ success: true, data: prices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
