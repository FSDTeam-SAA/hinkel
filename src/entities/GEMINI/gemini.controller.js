import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generateLineArtPreview = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image)
      return res.status(400).json({ error: 'No image data provided' });

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-image-preview'
    });

    const mimeTypeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
    const base64Data = image.split(',')[1] || image;

    const prompt =
      'Convert this image into a simple black and white line art drawing for kids to color. Use bold outlines and no shading.';

    const result = await model.generateContent({
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ['IMAGE']
      }
    });

    const response = await result.response;

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData
    );

    if (imagePart) {
      const base64Response = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      return res.json({ previewUrl: base64Response });
    }

    res
      .status(500)
      .json({
        error:
          'Model did not return an image. Check your prompt or model choice.'
      });
  } catch (error) {
    console.error('Gemini Error:', error);
    res.status(500).json({ error: error.message });
  }
};
