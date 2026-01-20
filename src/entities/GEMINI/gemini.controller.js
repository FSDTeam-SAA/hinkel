import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generateLineArtPreview = async (req, res) => {
  try {
    const { image, type } = req.body;
    if(!type)
      return res.status(400).json({ error: 'No type provided'})
    if (!image)
      return res.status(400).json({ error: 'No image data provided' });

    // Define prompts for each style type
    const promptMap = {
      kids: 'Convert this image into a simple black and white line art drawing for kids to color. Thick bold outlines, extremely simple, large spaces, no detail.',
      pets: 'Convert this image into a simple black and white line art drawing. Medium-thick lines, keep fur textures as simple strokes, no shading.',
      memory:
        'Convert this image into a simple black and white line art drawing. Medium-thick lines, no background distractions, easy-to-see shapes, no shading.',
      adults:
        'Convert this image into a simple black and white line art drawing. Fine lines, medium detail, but still clean black and white, NO shading.'
    };

    // Default to 'kids' if type is not provided or invalid
    const selectedType =
      type && promptMap[type.toLowerCase()] ? type.toLowerCase() : 'kids';
    const prompt = promptMap[selectedType];

    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-image-preview'
    });

    const mimeTypeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
    const base64Data = image.split(',')[1] || image;

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

    res.status(500).json({
      error: 'Model did not return an image. Check your prompt or model choice.'
    });
  } catch (error) {
    console.error('Gemini Error:', error);
    res.status(500).json({ error: error.message });
  }
};
//test
