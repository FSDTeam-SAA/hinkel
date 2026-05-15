import Pricing from '../admin/pricing.model.js';
import { couponService } from '../admin/coupon/coupon.service.js';

const ALLOWED_UPGRADES = {
  digital: ['print&digital'],
  print: ['print&digital']
};

const roundCurrencyToCents = (amount) => Math.round(Number(amount) * 100);

export const isAllowedUpgrade = (currentDeliveryType, targetDeliveryType) => {
  return Boolean(ALLOWED_UPGRADES[currentDeliveryType]?.includes(targetDeliveryType));
};

export const getPricingConfig = async (deliveryType) => {
  const pricingConfig = await Pricing.findOne({ deliveryType }).lean();

  if (!pricingConfig) {
    throw new Error('Pricing configuration not found');
  }

  return pricingConfig;
};

export const getTierPrice = async (deliveryType, pageCount) => {
  const pricingConfig = await getPricingConfig(deliveryType);
  const pageTiers = [...(pricingConfig.pageTiers || [])].sort(
    (a, b) => a.pageLimit - b.pageLimit
  );

  if (pageTiers.length === 0) {
    throw new Error('Pricing tiers not configured');
  }

  const matchingTier =
    pageTiers.find((tier) => pageCount <= tier.pageLimit) ||
    pageTiers[pageTiers.length - 1];

  return {
    deliveryType,
    pageCount,
    currency: pricingConfig.currency || 'usd',
    pageTiers,
    unitPrice: matchingTier.price
  };
};

export const getInitialOrderQuote = async ({
  deliveryType,
  pageCount,
  couponCode
}) => {
  const tierQuote = await getTierPrice(deliveryType, pageCount);
  const baseTotalCents = roundCurrencyToCents(tierQuote.unitPrice);

  let totalAmountCents = baseTotalCents;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await couponService.getCouponByCodeFromDb(couponCode);
    appliedCoupon = {
      code: coupon.codeName,
      discountAmount: coupon.discountAmount,
      discountType: coupon.discountType
    };

    if (coupon.discountType === 'flat') {
      totalAmountCents = Math.max(
        0,
        totalAmountCents - roundCurrencyToCents(coupon.discountAmount)
      );
    } else if (coupon.discountType === 'percentage') {
      const discountCents = Math.round(
        (totalAmountCents * coupon.discountAmount) / 100
      );
      totalAmountCents = Math.max(0, totalAmountCents - discountCents);
    }
  }

  return {
    ...tierQuote,
    baseTotalCents,
    totalAmountCents,
    totalPrice: Number((totalAmountCents / 100).toFixed(2)),
    appliedCoupon
  };
};

export const getAdjustmentQuote = async ({
  existingOrder,
  targetDeliveryType,
  targetPageCount
}) => {
  if (!existingOrder) {
    throw new Error('Order not found');
  }

  if (targetPageCount < existingOrder.pageCount) {
    throw new Error('Target page count cannot be lower than the current order');
  }

  const deliveryTypeChanged = targetDeliveryType !== existingOrder.deliveryType;
  const pageCountChanged = targetPageCount !== existingOrder.pageCount;

  if (!deliveryTypeChanged && !pageCountChanged) {
    throw new Error('No additional payment required for this order');
  }

  if (deliveryTypeChanged && !isAllowedUpgrade(existingOrder.deliveryType, targetDeliveryType)) {
    throw new Error('Only package upgrades to print&digital are supported');
  }

  const tierQuote = await getTierPrice(targetDeliveryType, targetPageCount);
  const targetTotalCents = roundCurrencyToCents(tierQuote.unitPrice);
  const currentTotalCents = existingOrder.totalAmount;
  const deltaCents = targetTotalCents - currentTotalCents;

  if (deltaCents <= 0) {
    throw new Error('No additional payment required for this adjustment');
  }

  return {
    orderId: existingOrder._id,
    currency: tierQuote.currency,
    currentDeliveryType: existingOrder.deliveryType,
    targetDeliveryType,
    currentPageCount: existingOrder.pageCount,
    targetPageCount,
    currentTotalCents,
    targetTotalCents,
    deltaCents
  };
};
