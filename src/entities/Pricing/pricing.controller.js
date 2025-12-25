import PricingTier from '../Pricing/pricing.model.js'

class PricingTierController {

  // CREATE
  async create(req, res) {
    try {
      const { pageCount, digitalPrice, printPrice } = req.body;

      const exists = await PricingTier.findOne({ pageCount });
      if (exists) {
        return res.status(400).json({
          message: 'Pricing tier for this page count already exists'
        });
      }

      const tier = await PricingTier.create({
        pageCount,
        digitalPrice,
        printPrice
      });

      res.status(201).json(tier);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // GET ALL (ADMIN + PUBLIC SAFE)
  async getAll(req, res) {
    try {
      const tiers = await PricingTier
        .find({ isActive: true })
        .sort({ pageCount: 1 });

      res.json(tiers);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // GET SINGLE BY PAGE COUNT
  async getByPageCount(req, res) {
    try {
      const { pageCount } = req.params;

      const tier = await PricingTier.findOne({
        pageCount,
        isActive: true
      });

      if (!tier) {
        return res.status(404).json({ message: 'Pricing tier not found' });
      }

      res.json(tier);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // UPDATE
  async update(req, res) {
    try {
      const { id } = req.params;

      const tier = await PricingTier.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!tier) {
        return res.status(404).json({ message: 'Pricing tier not found' });
      }

      res.json(tier);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // SOFT DELETE (RECOMMENDED)
  async remove(req, res) {
    try {
      const { id } = req.params;

      const tier = await PricingTier.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!tier) {
        return res.status(404).json({ message: 'Pricing tier not found' });
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

export default new PricingTierController();
