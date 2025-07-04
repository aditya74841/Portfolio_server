import { Prompt } from "../model/prompt.model.js";

// CREATE new prompt
export const createPrompt = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Prompt (title) is required" });
    }

    const prompt = new Prompt({ title });
    await prompt.save();

    res.status(201).json({ message: "Prompt saved", prompt });
  } catch (error) {
    console.error("Error saving prompt:", error);
    res.status(500).json({ error: "Server error" });
  }
};