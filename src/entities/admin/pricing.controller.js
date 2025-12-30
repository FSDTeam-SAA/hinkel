import Pricing from './pricing.model.js'


// Create or Update pricing for a delivery method
export const setPrice = async (req, res) => {
  try {
    const { deliveryType, pricePerPage, currency } = req.body;

    // Use findOneAndUpdate with upsert: true to create if missing or update if exists
    const updatedPricing = await Pricing.findOneAndUpdate(
      { deliveryType },
      { pricePerPage, currency: currency || 'usd' },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Price for ${deliveryType} updated successfully`,
      data: updatedPricing
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get all set prices for the frontend dropdowns/selection
export const getAllPrices = async (req, res) => {
  try {
    const prices = await Pricing.find();
    res.status(200).json({ success: true, data: prices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}