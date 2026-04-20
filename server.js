const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.static(path.join(__dirname)));

function safeSerialize(obj) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

async function getGuildMemberDiscordData(member) {
  const user = member.user;
  const userId = user.id;

  let avatarUrl;
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.${ext}?size=128`;
  } else {
    const defaultIdx = Number((BigInt(userId) >> 22n) % 6n);
    avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultIdx}.png`;
  }

  return {
    id: userId,
    username: member.nick || user.global_name || user.username,
    avatarUrl,
    roles: member.roles,
    isBot: user.bot === true,
  };
}

app.get("/api/staff", async (req, res) => {
  try {
    const guildId = process.env.GUILD_ID;
    const staffRoleIds = process.env.STAFF_ROLE_IDS?.split(",").map(r => r.trim()) ?? [];

    let members = [];
    let after = "0";

    while (true) {
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000&after=${after}`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const err = await response.json();
        console.error("[ERROR] Guild members fetch failed:", err);
        return res.status(500).json({ error: "Failed to fetch guild members." });
      }

      const batch = await response.json();
      if (batch.length === 0) break;
      members.push(...batch);
      if (batch.length < 1000) break;
      after = batch[batch.length - 1].user.id;
    }

    const staffMembers = members.filter(m =>
      m.roles.some(r => staffRoleIds.includes(r))
    );

    const enriched = await Promise.all(staffMembers.map(getGuildMemberDiscordData));

    res.json(safeSerialize(enriched));
  } catch (err) {
    console.error("[SERVER ERROR] /api/staff failed:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});