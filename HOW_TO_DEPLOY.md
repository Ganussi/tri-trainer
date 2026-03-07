# How to Put Tri Trainer on Your Phone

This guide gets your training app live on the internet in about 20 minutes,
then installed on your iPhone home screen. No coding knowledge needed —
you're just running a few commands and clicking some buttons.

---

## What you need

- A computer (Mac or Windows)
- Your phone
- A free GitHub account → https://github.com
- A free Vercel account → https://vercel.com (sign up with GitHub)

---

## Step 1 — Install Node.js on your computer

Node.js is what lets you run the app locally and build it for deployment.

1. Go to **https://nodejs.org**
2. Download the **LTS** version (the left button)
3. Run the installer — click Next through everything, keep all defaults
4. When it's done, open **Terminal** (Mac) or **Command Prompt** (Windows)
5. Type this and press Enter to confirm it worked:
   ```
   node --version
   ```
   You should see something like `v20.11.0`. If you do, you're good.

---

## Step 2 — Set up the project

1. Unzip the **tri-trainer** folder you downloaded from Claude
2. Open **Terminal** (Mac) or **Command Prompt** (Windows)
3. Navigate into the folder. For example if it's on your Desktop:
   - **Mac:** `cd ~/Desktop/tri-trainer`
   - **Windows:** `cd C:\Users\YourName\Desktop\tri-trainer`
4. Install the project dependencies by typing:
   ```
   npm install
   ```
   This downloads everything the app needs. It takes about 1 minute.
5. Test it works locally:
   ```
   npm run dev
   ```
   Open your browser and go to **http://localhost:5173** — you should see your app!
   Press Ctrl+C to stop it when you're done checking.

---

## Step 3 — Put the code on GitHub

GitHub is where your code lives online. Vercel will read it from there.

1. Go to **https://github.com** and sign in (or create a free account)
2. Click the **+** button in the top right → **New repository**
3. Name it `tri-trainer`
4. Leave everything else as default, click **Create repository**
5. GitHub will show you a page with commands. Copy and run these one at a time
   in your Terminal (inside the tri-trainer folder):
   ```
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/tri-trainer.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your actual GitHub username.
6. Refresh the GitHub page — you should see your files there.

---

## Step 4 — Deploy to Vercel

Vercel hosts your app for free and gives it a public URL.

1. Go to **https://vercel.com** and sign in with your GitHub account
2. Click **Add New → Project**
3. Find and select your `tri-trainer` repository
4. Vercel will auto-detect it's a Vite project. Leave all settings as default.
5. Click **Deploy**
6. Wait about 1 minute while it builds
7. You'll get a URL like `tri-trainer-abc123.vercel.app` — **this is your app!**

Open that URL in your browser to confirm it works.

---

## Step 5 — Install it on your iPhone

This is the part that makes it feel like a real app on your home screen.

1. On your iPhone, open **Safari** (must be Safari, not Chrome)
2. Go to your Vercel URL (e.g. `tri-trainer-abc123.vercel.app`)
3. Tap the **Share** button at the bottom of the screen (the box with an arrow pointing up)
4. Scroll down and tap **"Add to Home Screen"**
5. Name it **Tri Trainer** and tap **Add**

It now appears on your home screen with the orange icon, opens full screen
with no browser bars, and feels like a native app.

---

## Updating the app in the future

If Claude makes changes to the app and gives you a new `App.jsx` file:

1. Replace the file at `tri-trainer/src/App.jsx` with the new one
2. In Terminal, run:
   ```
   git add .
   git commit -m "update app"
   git push
   ```
3. Vercel automatically detects the change and redeploys within 1 minute.
   Your phone will get the update next time you open the app.

---

## Your data

Your training logs, benchmarks and progress are saved in your phone's browser
storage (localStorage). This means:
- Data stays on your device privately
- It persists between sessions — closing and reopening the app keeps everything
- If you clear Safari's website data, it will reset (so don't do that!)

---

## Troubleshooting

**"npm is not recognised"** → Node.js didn't install correctly. Restart your
computer and try again, or re-download from nodejs.org.

**The app shows an error** → Make sure you're inside the `tri-trainer` folder
in Terminal before running any commands.

**Vercel can't find the project** → Make sure Step 3 completed successfully
and your files are visible on GitHub before trying to deploy.

**The app doesn't appear on your home screen like a native app** →
Make sure you're using Safari on iPhone, not Chrome or Firefox.

---

That's it! If anything goes wrong at any step, paste the error message
to Claude and it will help you fix it.
