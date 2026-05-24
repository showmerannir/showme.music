# showMe CRM — Complete Setup Guide

> No technical experience needed. Follow each step in order and you'll have your CRM running in about 20 minutes.

---

## What you'll set up

| Service | What it does | Cost |
|---------|-------------|------|
| **Supabase** | Your database — stores all your leads and contacts | Free |
| **Google Gemini** | The AI that finds leads and writes emails | Free |
| **ClickUp** | Syncs with your existing ClickUp workspace | Free (you already have it) |

---

## Step 1 — Install Node.js on your computer

Node.js is the software that runs the app on your computer.

1. Go to **nodejs.org**
2. Click the big button that says **"Download Node.js (LTS)"** — LTS means the stable version
3. Open the downloaded file and click through the installer (just keep clicking Next/Continue)
4. When it's done, **restart your computer**

---

## Step 2 — Open the project in Terminal

The Terminal is a text-based window where you type commands to run the app.

**On Mac:**
1. Press `Command + Space`, type **Terminal**, press Enter
2. Type `cd ` (with a space after it), then drag your project folder into the Terminal window — this fills in the path automatically
3. Press Enter

**On Windows:**
1. Open the project folder in File Explorer
2. Click in the address bar at the top, type `cmd`, press Enter — a black window opens
3. You're already in the right folder

**Then type this command and press Enter:**
```
npm install
```
> You'll see a lot of text scroll by — this is normal. It's downloading what the app needs. Takes 1-2 minutes.

---

## Step 3 — Create your free Supabase account (the database)

Supabase stores all your leads, contacts, and emails. It's completely free.

1. Go to **supabase.com**
2. Click **"Start your project"**
3. Sign up with your GitHub account or email
4. Once logged in, click **"New project"**
5. Fill in:
   - **Name:** `showme-crm` (or anything you like)
   - **Database Password:** make up a strong password and **save it somewhere safe** (you'll need it later if you ever access the database directly)
   - **Region:** choose the one closest to you (e.g. US East, EU West)
6. Click **"Create new project"**
7. **Wait about 2 minutes** — you'll see a loading screen while Supabase sets up your database

---

## Step 4 — Copy your Supabase API keys

Once the project is ready:

1. In the left sidebar, click **"Project Settings"** (the gear icon at the bottom)
2. Click **"API"** in the settings menu
3. You'll see three values — you need all three:

   - **Project URL** — looks like `https://abcdefghijk.supabase.co`  
     → Copy this
   
   - **anon public** key — a very long string starting with `eyJ...`  
     → Copy this (under "Project API keys")
   
   - **service_role** key — another very long string  
     → Click **"Reveal"** then copy it. **Keep this one secret — never share it.**

4. **Save all three values** in a text file or Notes app for now — you'll paste them in Step 8

---

## Step 5 — Create your database tables

Now you'll paste some code into Supabase to create the tables where your data will live.

1. In Supabase, click **"SQL Editor"** in the left sidebar (looks like a terminal icon)
2. Click **"New query"** (top right)
3. Open the project folder on your computer → open the `supabase` folder → open `migrations` → open the file **`001_initial_schema.sql`** in any text editor (Notepad, TextEdit, etc.)
4. Press `Ctrl+A` (Windows) or `Command+A` (Mac) to select ALL the text, then `Ctrl+C` / `Command+C` to copy
5. Go back to Supabase SQL Editor and paste it in (`Ctrl+V` / `Command+V`)
6. Click the green **"Run"** button
7. You should see a message saying **"Success"** at the bottom

**Repeat for the second file:**
8. Click **"New query"** again
9. Open **`002_rls_policies.sql`** from the same folder, copy ALL the text
10. Paste into the new query and click **"Run"** → should say **"Success"**

> If you see an error, make sure you selected ALL the text (Ctrl+A first). The files are long and it's easy to miss the beginning.

---

## Step 6 — Set up your login system in Supabase

1. In Supabase left sidebar, click **"Authentication"**
2. Click **"Providers"** — make sure **Email** shows as **Enabled** (it should be by default)
3. Click **"URL Configuration"** in the Authentication menu
4. Set **"Site URL"** to: `http://localhost:3000`
5. Under **"Redirect URLs"**, click **"Add URL"** and type: `http://localhost:3000/callback`
6. Click **"Save"**

---

## Step 7 — Get a free Google Gemini API key

Gemini is Google's AI — it powers the lead discovery and email writing features. The free tier allows 1,500 requests per day, which is plenty.

1. Go to **aistudio.google.com**
2. Sign in with your Google account
3. Click **"Get API key"** (top left or in a button on the page)
4. Click **"Create API key"**
5. Select **"Create API key in new project"**
6. A long key will appear — click the **copy icon** next to it
7. **Save this key** in your notes — you'll need it in Step 9

---

## Step 8 — Get your ClickUp API token and List ID

This connects the CRM to your existing ClickUp workspace so leads stay in sync.

**Get your API token:**
1. In ClickUp, click your **profile avatar** (bottom-left corner)
2. Click **"Settings"**
3. Click **"Apps"** in the left menu
4. Scroll down to find **"API Token"**
5. Click **"Generate"** (or copy if one already exists)
6. Copy the token — it starts with `pk_`

**Find your List ID:**
1. In ClickUp, navigate to the **List** where you want leads to appear (create one if needed, e.g. "showMe Leads")
2. Look at the **URL in your browser** — it looks something like:  
   `https://app.clickup.com/1234567/v/li/901234567890`
3. The number after `/li/` is your **List ID** — copy it (e.g. `901234567890`)

---

## Step 9 — Create your environment file

This is the file that holds all your secret keys. The app reads this file when it starts.

1. Open your project folder
2. Find the file called **`.env.example`**  
   > On Mac, files starting with `.` are hidden by default. Press `Command+Shift+.` in Finder to show hidden files.
3. Make a **copy** of it and rename the copy to **`.env.local`** (exactly that — dot, env, dot, local)
4. Open **`.env.local`** in a text editor
5. Fill in each value — replace everything after the `=` sign:

```
NEXT_PUBLIC_SUPABASE_URL=           ← paste your Supabase Project URL from Step 4
NEXT_PUBLIC_SUPABASE_ANON_KEY=      ← paste the anon public key from Step 4
SUPABASE_SERVICE_ROLE_KEY=          ← paste the service_role key from Step 4

GOOGLE_AI_API_KEY=                  ← paste your Gemini key from Step 7

CLICKUP_API_TOKEN=                  ← paste your ClickUp token from Step 8
CLICKUP_WEBHOOK_SECRET=             ← type any random word here (e.g. mysecret123)

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

6. Save the file

> **Important:** Never share this file or commit it to GitHub. It contains your private keys.

---

## Step 10 — Run the app

1. Go back to your Terminal window (from Step 2)
2. Type this command and press Enter:
   ```
   npm run dev
   ```
3. Wait about 15 seconds — you'll see something like:
   ```
   ✓ Ready in 2.3s
   ○ Local: http://localhost:3000
   ```
4. Open your browser and go to: **http://localhost:3000**
5. You'll see the showMe CRM login page!

---

## Step 11 — Create your account

1. On the login page, click **"Sign Up"**
2. Enter your email and a password
3. Click **"Sign Up"**
4. You'll be redirected to the **Leads** page — you're in! 🎉

---

## Step 12 — Configure your ICP and ClickUp sync

Now tell the CRM who you're targeting and connect it to ClickUp.

1. Click **"Settings"** in the left sidebar
2. Under **"ICP Profile"**:
   - Select whether you're targeting **Venues**, **Promoters**, or both
   - Fill in capacity ranges, genres, locations, and any keywords
   - Click **"Save ICP Profile"**
3. Under **"ClickUp Integration"**:
   - Paste your **ClickUp API Token** (from Step 8)
   - Paste your **ClickUp List ID** (from Step 8)
   - Click **"Test Connection"** — you should see your list name appear
   - Fill in the **Status Mapping** — match each CRM stage to a ClickUp status name (type the exact status name from your ClickUp list, e.g. "To Do", "In Progress")
   - Click **"Save"**

---

## You're all set! Here's how to use it

**Add leads manually:**
- Go to **Leads** → click **"Add Lead"** → fill in the details

**Discover leads with AI:**
- Go to **Discover** → describe what you're looking for (e.g. "Jazz clubs in New York with capacity over 300") → click Search
- Leads stream in one by one — click **"Add to Pipeline"** on any you want to pursue

**Enrich a lead (find email + phone):**
- Open a lead → go to the **Contacts** tab → click **"Run Enrichment"**
- The system will scrape the venue's website for contact info

**Generate a personalized email:**
- Open a lead → go to the **Email Draft** tab → click **"Generate Email"**
- The AI researches the venue and writes a personalized email
- Click **"Copy"** to copy it to your clipboard, then paste into your email client

**ClickUp sync:**
- Leads sync to ClickUp automatically when created or status changes
- Drag a task in ClickUp to a new status and the CRM updates too (requires webhook setup — see below)

---

## Keeping the app running

The app only runs while the Terminal window is open and `npm run dev` is running.

- To **stop** the app: press `Ctrl+C` in the Terminal
- To **start** it again: open Terminal in the project folder and type `npm run dev`

In the future, you can deploy the app to a service like **Vercel** so it runs 24/7 without needing your computer on — but this is optional and a separate step.

---

## Troubleshooting

**"Cannot find module" error when running `npm run dev`**
→ Run `npm install` again in the Terminal, then try `npm run dev`

**Login page shows but signing in gives an error**
→ Double-check Step 6 — make sure you added `http://localhost:3000/callback` to the Redirect URLs in Supabase

**"Invalid API key" error**
→ Open `.env.local` and check that you didn't accidentally leave a space before or after the `=` sign or the key value

**SQL migration gives an error**
→ Make sure you selected ALL the text in the file (Ctrl+A / Command+A) before copying — these files are long and it's easy to copy only part of them. Also make sure you ran both files separately.

**Leads aren't syncing to ClickUp**
→ Check that your ClickUp API token starts with `pk_`. Also verify the List ID is just the number (no slashes or other characters)

**"Run Enrichment" finds no emails**
→ This is normal for venues that don't list contact info publicly on their website. Try the AI email generator with what info you have — it will personalize based on what Gemini knows about the venue.

**The app won't start at all**
→ Make sure Node.js is installed (Step 1). In Terminal, type `node --version` and press Enter — if you see a version number like `v20.11.0`, Node is installed correctly.

---

## Getting help

If you're stuck on any step, the most helpful information to share is:
1. Which step number you're on
2. Any error message you see (screenshot or copy the exact text)
3. What operating system you're using (Mac or Windows)
