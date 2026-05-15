import Order from './order.model.js';
import { generateResponse } from '../../lib/responseFormate.js';
import cloudinary from '../../lib/cloudinaryUpload.js';

/**
 * Secure PDF proxy endpoint
 * 
 * Streams the book PDF from Cloudinary to the client with protective headers
 * that prevent easy downloading and copying.
 * 
 * Access rules:
 *   - Admin: can view any order's book
 *   - Regular user: can only view their own order's book
 * 
 * Route: GET /order/:orderId/view-pdf
 */
export const viewBookPdf = async (req, res) => {
  try {
    const { orderId } = req.params;
    const user = req.user;

    if (!orderId) {
      return generateResponse(res, 400, false, 'orderId is required', null);
    }

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return generateResponse(res, 404, false, 'Order not found', null);
    }

    // Authorization check: admin can see all, user can only see their own
    const isAdmin = user.role === 'ADMIN';
    const isOwner = order.userId.toString() === user._id.toString();
    const isDigitalDelivery =
      order.deliveryType === 'digital' || order.deliveryType === 'print&digital';

    if (!isAdmin && !isOwner) {
      return generateResponse(res, 403, false, 'You are not authorized to view this book', null);
    }

    if (!isAdmin && isDigitalDelivery) {
      return generateResponse(
        res,
        403,
        false,
        'Digital books are delivered by email only',
        null
      );
    }

    // Check if book exists
    if (!order.book) {
      return generateResponse(res, 404, false, 'No book file found for this order', null);
    }

    // Fetch the PDF from Cloudinary
    let cloudinaryUrl = order.book;

    // If the asset is authenticated, we need to generate a signed URL
    if (cloudinaryUrl.includes('/authenticated/')) {
      // Extract public_id from URL: .../authenticated/v123/folder/id
      // This is a bit brittle, a better way would be to store public_id in the DB
      // But for now, let's use the SDK to sign if we can identify it
      const parts = cloudinaryUrl.split('/authenticated/');
      if (parts.length > 1) {
        const pathParts = parts[1].split('/');
        // Skip version (v123) if present
        const startIndex = pathParts[0].startsWith('v') ? 1 : 0;
        const publicIdWithExt = pathParts.slice(startIndex).join('/');
        const publicId = publicIdWithExt.split('.')[0];

        cloudinaryUrl = cloudinary.url(publicId, {
          resource_type: 'raw',
          type: 'authenticated',
          sign_url: true,
          secure: true,
          expires_at: Math.floor(Date.now() / 1000) + 600 // 10 minutes
        });
      }
    }

    const response = await fetch(cloudinaryUrl);

    if (!response.ok) {
      console.error(`Failed to fetch PDF from Cloudinary: ${response.status} ${response.statusText}`);
      return generateResponse(res, 502, false, 'Failed to retrieve book file', null);
    }

    // Set protective headers to prevent download/copy
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="protected-document.pdf"'); // inline = view only, no download prompt
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'self'"); // Very restrictive CSP for the PDF content itself

    // Allow embedding in the frontend application while preventing external sites
    // Note: X-Frame-Options: SAMEORIGIN is too restrictive if frontend/backend are on different ports
    // frame-ancestors is the modern and more flexible replacement
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.setHeader('Content-Security-Policy', `frame-ancestors 'self' ${frontendUrl}`);

    // Stream the PDF response to the client
    const reader = response.body.getReader();

    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    };

    await pump();
  } catch (error) {
    console.error('PDF Proxy Error:', error);
    return generateResponse(res, 500, false, 'Failed to serve book file', null);
  }
};

/**
 * Generate a cover thumbnail URL from a Cloudinary PDF URL.
 * Cloudinary can transform PDFs to images by appending page & format params.
 * 
 * Example:
 *   Input:  https://res.cloudinary.com/.../upload/v123/items/my-book.pdf
 *   Output: https://res.cloudinary.com/.../upload/pg_1,w_600,h_800,c_fill/v123/items/my-book.jpg
 */
export const getBookThumbnailUrl = (pdfUrl) => {
  if (!pdfUrl) return null;

  try {
    // For Cloudinary raw uploads, we can't transform directly
    // Instead, return the URL as-is for now (it's used as cover image)
    // The proxy endpoint handles the actual PDF viewing security
    return pdfUrl;
  } catch (error) {
    console.error('Error generating thumbnail URL:', error);
    return null;
  }
};
