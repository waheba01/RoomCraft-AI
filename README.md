# 🏠 RoomCraft AI

**AI-Assisted Interior Recommendation & Redesign System**

---

## ✨ About the Project

RoomCraft AI is a simple web-based project that helps users redesign their room using AI.

The idea is to take a normal room image and show how it can look with better furniture and styling — without actually changing the room structure.

Users can:
- Upload a room image
- Select room type, style, and budget
- Get a redesigned preview (AI-based)
- See furniture suggestions with estimated prices

---

## 🚀 Features

- AI-based room redesign (Stable Diffusion img2img)
- Furniture recommendation system (rule-based)
- Budget-based price estimation (INR)
- Amazon product links for each item
- Total cost calculation
- Works even without API (fallback mode)

---

## 🧠 Concepts Used

This project uses both AI and basic logic systems:

- **Generative AI** → for image redesign  
- **Prompt Engineering** → to control AI output  
- **Rule-Based System** → for furniture suggestions  
- **Constraint Logic** → for budget + style filtering  

---

## 🏗️ How It Works

1. User uploads a room image  
2. Selects:
   - Room type  
   - Style  
   - Budget  
3. Clicks Generate  

Then:

- AI tries to redesign the room image  
- At the same time, system generates furniture list  
- Finally, results are shown with cost summary  

---

## 🖼️ Preview

assets/after/hall.jpg


---

## ⚙️ Tech Stack

- HTML, CSS, JavaScript  
- Stable Diffusion (img2img)  
- Replicate API  
- FileReader API  
- sessionStorage  

---

## ⚡ Important Detail

To keep the same room structure: 

prompt_strength = 0.45


This ensures:
- Room stays same ✅  
- Only furniture changes ✅  

---

## ⚡ Fallback Mode

If API is not working:

- Demo image is shown  
- Furniture system still works  
- Cost calculation still works  

So project never breaks during demo 👍  

---

## 📦 Folder Structure

RoomCraft-AI/
│── index.html
│── style.css
│── script.js
│── assets/
│── README.md


---

## 🔐 API Key (Optional)

- Add your Replicate API key in UI  
- Stored in sessionStorage  
- If not added → demo mode runs  

---

## 🎯 Use Case

- AIML mini project  
- Interior idea preview  
- Budget planning  

---

## 💡 Future Improvements

- Better AI accuracy (ControlNet)
- Real-time product pricing
- 3D room preview

---

## 👩‍💻 Author

Waheba Ansari  
AIML Mini Project (2026)

---

## ⭐ Note

Even without AI:
- Recommendations work  
- Cost works  
- UI works  

AI is just an extra feature, not dependency.

