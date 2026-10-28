# 🚀 CodeChef Streak & Contest Tracker (Next.js + Vercel Ready)

Ek fast, modern web application jisme koi bhi CodeChef user apna profile link ya username enter karke apni **Contest Streaks**, **Total Contests Participated**, **Rating History**, aur **Rankings** check kar sakta hai.

---

## ✨ Features

- 🔗 **Smart URL & Username Parsing**:
  - `https://www.codechef.com/users/abhiyank_in` ya sirf `abhiyank_in` dono support karta hai.
- 🏆 **Total Contests Participated**:
  - CodeChef par user ne ab tak kitne official contests diye hain.
- 🔥 **Contest Streak Intelligence**:
  - **Current Contest Streak**: Lagataar kitne contests attend kiye hain (weekly / consecutive Starters).
  - **Max / Longest Contest Streak**: All-time continuous streak record.
- 📈 **Interactive Rating Trajectory Graph**:
  - Har contest ke baad rating ka graphical visualization.
- 📋 **Detailed Contest Breakdown Table**:
  - Har contest ka naam, date, rank, rating, aur delta change (+/-).
- 🌍 **Ranks & Badges**:
  - Current Rating, Peak Rating, Stars (1★ to 7★), Global Rank, Country Rank.
- ⚡ **Vercel Optimized**:
  - Zero heavy browser dependencies (Puppeteer nahi chahiye).
  - Next.js Serverless Route with smart edge caching (`s-maxage=60`).
  - 100% Free on Vercel Hobby plan.

---

## 🛠️ Local Development (Testing)

```bash
# 1. Project folder me jayein
cd codechef-streak-tracker

# 2. Dependencies install karein (already installed)
npm install

# 3. Development server start karein
npm run dev
```

Browser me open karein: **`http://localhost:3000`**

---

## 🚀 Vercel par Deploy Kaise Karein (Step-by-Step)

### Option 1: GitHub ke zariye (Sabse aasan - Recommended)

1. Apne GitHub account par ek new repository banayein (e.g. `codechef-streak-tracker`).
2. Is folder me git init karein aur code push karein:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of CodeChef streak tracker"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/codechef-streak-tracker.git
   git push -u origin main
   ```
3. [Vercel.com](https://vercel.com) par login karein.
4. **"Add New..."** ➔ **"Project"** par click karein.
5. Apni GitHub repository select karein aur **"Deploy"** button daba dein!
6. Next.js hone ki wajah se Vercel sab automatically detect kar lega aur 1 minute me aapki live link mil jayegi (e.g. `https://codechef-streak-tracker.vercel.app`).

### Option 2: Vercel CLI ke zariye

```bash
# Vercel CLI install karein
npm i -g vercel

# Deploy karein
vercel
```

---

## 📁 Project Structure

```
codechef-streak-tracker/
├── app/
│   ├── api/
│   │   └── codechef/
│   │       └── route.ts     # Backend serverless scraper & streak calculator
│   ├── globals.css          # Tailwind & dark theme styling
│   ├── layout.tsx           # SEO & Root Layout
│   └── page.tsx             # Interactive Frontend with Search, Graphs & Tables
├── public/                  # Static assets
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Scripts & dependencies
```
