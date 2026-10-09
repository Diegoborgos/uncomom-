# Contest Gallery

A private web app that collects every Instagram post or Reel that uses **all** of your contest hashtags (e.g. `#worldofnicvonrupp` **and** `#worldpackers`), keeps a permanent copy of each video, and lets you review, shortlist and pick winners without opening Instagram.

It is a separate app from the main Uncomom site. It lives in this `contest/` folder and gets its own Vercel project.

**How it works:** once an hour, Supabase pings the app. The app asks Instagram for new posts with your first (priority) hashtag plus posts where your account is tagged, keeps only the ones whose caption contains every contest hashtag, saves them to the database, and copies each video and image into Supabase Storage. Instagram's links expire, so the copy is what you watch later.

---

## Part 1: Meta (Instagram) setup checklist

Do these in order. Allow about 30–45 minutes, plus waiting time if Meta asks for App Review (see step 8).

### 1. Make your Instagram a professional account
Instagram app → Profile → ☰ → **Settings and privacy** → **Account type and tools** → **Switch to professional account**. Choose **Creator** or **Business**; either works.

### 2. Link it to a Facebook Page
Instagram's API only works through a Facebook Page.
- Create a Facebook Page if you don't have one (facebook.com/pages/create). It can be a simple page for your brand.
- Link it: in Instagram → **Settings** → **Accounts Center** → **Accounts** → add your Facebook account. Then on the Facebook Page → **Settings** → **Linked accounts** → **Instagram** → connect.

### 3. Create a Meta developer account
Go to **developers.facebook.com**, log in with the Facebook account that manages the Page, and register as a developer (accept the terms and verify your phone or email).

### 4. Create the app
- **My Apps** → **Create App**.
- Use case: pick the option for managing everything on your Page, or **Other** → app type **Business**. Wording changes often; you want the path that offers **Instagram API with Facebook Login**.
- Give it a name, e.g. "Contest Gallery".
- Add the **Instagram** product, and choose **API setup with Facebook login** (not "Instagram login"). Hashtag search is only available on the Facebook-login path.

### 5. Copy your App ID and App Secret
App dashboard → **App settings** → **Basic**. Copy **App ID** and **App Secret** (click "Show"). You'll paste them into Vercel in Part 2. Never share the secret.

### 6. Get a token in the Graph API Explorer
- Open **developers.facebook.com/tools/explorer**.
- Top right: choose your app under **Meta App**, and **User Token** under **User or Page**.
- Click **Add a permission** and add:
  - `instagram_basic`
  - `pages_show_list`
  - `pages_read_engagement`
  - `instagram_manage_comments` (needed for posts where you're tagged)
  - `business_management` (only if your Page is managed through Business Manager)
- Click **Generate Access Token**. In the pop-up, **select your Page and your Instagram account** and approve.
- Copy the long token (starts with `EAA…`). It only lasts an hour, so paste it into the app soon (Part 3, step 3). The app swaps it for a long-lived one automatically.

### 7. Keep the app in Development mode
You are an admin of the app, so you can use it with your own account in Development mode. Don't switch it to Live mode unless Meta requires it.

### 8. Hashtag search may need App Review
Meta's docs say hashtag search uses a feature called **Instagram Public Content Access**. Third-party guides consistently report that it needs **App Review** and often **Business Verification**, even for your own account. That can take days to weeks.

What this means in practice:
- Connect first and press **Fetch now** (Part 3). If the Settings page shows a hashtag error mentioning permission (error code 10 or 200), you need the review.
- To request it: App dashboard → **App Review** → **Permissions and Features** → **Instagram Public Content Access** → **Request advanced access**. Explain the use case plainly: *"We run a creator contest. We read public posts using our contest hashtag so we can review entries and pick winners. We don't store personal data beyond the post itself."* Meta usually wants a short screen recording of the app; this app's gallery works for that.
- **Meanwhile the backup source still works:** posts where your account is tagged are collected without App Review. Tell creators to **tag your account** in their post as well as using the hashtag. That also gives you their username, which hashtag results never include.

---

## Part 2: Put the app online (Supabase + Vercel)

### 1. Supabase: create the tables ✅ already done
The **Contest Gallery** Supabase project already has the tables, the private `contest-media` storage bucket and the hourly job.
(For a fresh project: SQL Editor → run [`supabase/schema.sql`](supabase/schema.sql), then [`supabase/cron.sql`](supabase/cron.sql).)

The one thing to copy from it: Supabase → **Contest Gallery** → **Project Settings → API Keys** → the **secret / service_role** key. Keep it private.

### 2. Vercel: create a second project
- vercel.com → **Add New… → Project** → import this same GitHub repository.
- **Project name:** `contest-gallery`.
- **Root Directory:** click **Edit** and choose `contest`. This is what makes it a separate app.
- Under **Environment Variables** add:

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://oeqgynufmrgkjhqzbvfr.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | the secret key from step 1 |
| `META_APP_ID` | from Part 1, step 5 |
| `META_APP_SECRET` | from Part 1, step 5 |
| `APP_PASSWORD` | your login password. For a teammate, add a second one after a comma: `myPass,teammatePass` |
| `CRON_SECRET` | the value Claude gave you in chat (it must match the one in the Supabase hourly job) |

- Click **Deploy**. When it's done you get an address like `contest-gallery.vercel.app`.

### 3. Hourly fetch ✅ automatic
Vercel's free plan only allows once-a-day scheduled jobs, so Supabase calls the app every hour. The app tells Supabase its address the first time it runs, so there's nothing to set up. (A once-a-day Vercel backup job is also built in.)

---

## Part 3: First test with a real hashtag

1. Open your app address, log in with `APP_PASSWORD`.
2. Go to **Settings**:
   - **Hashtags:** type them separated by spaces, most unique first: `#worldofnicvonrupp #worldpackers`. A post must use **all** of them to count. Only the first one is searched on Instagram (1 of your 30 weekly lookups); the others are checked in each post's caption.
   - **Contest start:** posts from before this date are ignored. Without it, Instagram's "top posts" would pull in popular posts of any age, which matters for a busy hashtag like `#worldpackers`. For a first test you can set it a few days back.
3. Paste the token from Part 1, step 6 into **Instagram connection** → **Connect**. You should see "Connected to @yourname".
4. Go back to the gallery and press **Fetch now**. After up to a minute you'll see how many posts were found and saved.
5. Check **Settings → Recent fetches** for messages. ✅ means everything worked; ⚠️ shows what Meta said.

---

## Part 4: How to run a contest

1. **Pick the hashtags.** Entries must use all of them. Put the most unique one first (`#worldofnicvonrupp`): it's the one searched on Instagram. A broad one like `#worldpackers` is only checked in the caption, so its everyday posts never reach the gallery.
2. **Set them in the app at least a day before launch.** Put the hashtags and **Contest start** (launch date) in Settings, then press **Fetch now** once to confirm it works. Instagram only returns hashtag posts from the **last 24 hours**, so the hourly job has to be running before entries arrive or some will be missed.
3. **Tell creators the rules:** put **both hashtags in the caption** (hashtags in a comment can't be seen by the app) **and tag your account**. Tagging gives you their username and is a second way to catch their post.
4. **During the contest:** the app collects new entries every hour. Check **Settings → Recent fetches** every few days for ⚠️ warnings.
5. **Review:** open the gallery on your phone. Filter **Not reviewed**, tap an entry to watch it, and use **★ Shortlist / 🏆 Winner / ✕ Reject**. Tap a button again to undo. Use **Notes** for comments; your teammate sees them too. **← Prev / Next →** move through the list. When a creator shows as "unknown", tap **Open original post** and type their name into **Creator**.
6. **Pick winners:** filter **Shortlisted**, sort by **Most engagement** if you like, and mark the winners.
7. **Export:** the **Export CSV** button downloads winners and shortlisted entries (username, profile link, post link, date, likes, comments, caption, notes). It opens in Excel, Numbers or Google Sheets.
8. **After the contest:** clear the hashtags in Settings to stop collecting. Videos stay in storage until you delete them.

---

## Good to know (limits)

- **30 hashtags per 7 days.** Meta lets one Instagram account look up at most 30 different hashtags in a rolling week. The app only searches your first hashtag, once, and remembers it, so normal running uses just 1.
- **Only the caption is checked.** Instagram's API returns the caption but not comments, so a post with a contest hashtag only in a comment is ignored. Settings → Recent fetches shows how many posts were ignored each hour.
- **Hashtag results never include the creator's username.** That's Meta's rule. Tagged posts include it, and you can type it in yourself.
- **Likes can be hidden.** If a creator hides likes, the app shows "hidden" and sorts that post as 0 likes.
- **Some posts can't be copied.** Instagram withholds the video link for some posts (often ones with copyrighted music). Those show a "Watch on Instagram" button instead.
- **Storage space.** Supabase's free plan has 1 GB of file storage and a 50 MB per-file limit. Reels are usually 5–30 MB, so expect roughly 50–100 videos on the free plan. For a big contest, upgrade Supabase to Pro (100 GB) or delete old videos after the contest. If you raise the per-file limit in Supabase, also set `MAX_FILE_MB` in Vercel.
- **Tokens.** The app stores a Facebook **Page token** (doesn't expire) and a backup **user token** (60 days, refreshed automatically). If you change your Facebook password or remove the app's access, paste a new token in Settings. Your App Secret stays in Vercel; tokens live in a locked database table because the app has to update them itself.
- **Hidden from search engines.** Every page requires the password, and the site tells search engines not to index it.
