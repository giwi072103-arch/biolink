// Каталог иконок. slug соответствует набору simple-icons на Iconify (api.iconify.design),
// поэтому сами SVG хранить в проекте не нужно — они подгружаются по URL.
const ICON_CATALOG = {
  social: [
    { slug: 'telegram', label: 'Telegram' },
    { slug: 'discord', label: 'Discord' },
    { slug: 'instagram', label: 'Instagram' },
    { slug: 'tiktok', label: 'TikTok' },
    { slug: 'youtube', label: 'YouTube' },
    { slug: 'twitch', label: 'Twitch' },
    { slug: 'spotify', label: 'Spotify' },
    { slug: 'vk', label: 'VKontakte' },
    { slug: 'whatsapp', label: 'WhatsApp' },
    { slug: 'snapchat', label: 'Snapchat' },
    { slug: 'reddit', label: 'Reddit' },
    { slug: 'pinterest', label: 'Pinterest' },
    { slug: 'linkedin', label: 'LinkedIn' },
    { slug: 'facebook', label: 'Facebook' },
    { slug: 'x', label: 'X (Twitter)' },
    { slug: 'threads', label: 'Threads' },
    { slug: 'github', label: 'GitHub' },
    { slug: 'gitlab', label: 'GitLab' },
    { slug: 'behance', label: 'Behance' },
    { slug: 'dribbble', label: 'Dribbble' },
    { slug: 'soundcloud', label: 'SoundCloud' },
    { slug: 'patreon', label: 'Patreon' },
    { slug: 'kick', label: 'Kick' },
    { slug: 'mastodon', label: 'Mastodon' },
    { slug: 'tumblr', label: 'Tumblr' },
    { slug: 'medium', label: 'Medium' },
    { slug: 'viber', label: 'Viber' },
    { slug: 'signal', label: 'Signal' },
    { slug: 'wechat', label: 'WeChat' },
    { slug: 'weibo', label: 'Weibo' },
    { slug: 'onlyfans', label: 'OnlyFans' },
    { slug: 'vimeo', label: 'Vimeo' }
  ],
  games: [
    { slug: 'steam', label: 'Steam' },
    { slug: 'epicgames', label: 'Epic Games' },
    { slug: 'battledotnet', label: 'Battle.net' },
    { slug: 'ea', label: 'EA' },
    { slug: 'ubisoft', label: 'Ubisoft' },
    { slug: 'playstation', label: 'PlayStation' },
    { slug: 'xbox', label: 'Xbox' },
    { slug: 'nintendoswitch', label: 'Nintendo Switch' },
    { slug: 'riotgames', label: 'Riot Games' },
    { slug: 'minecraft', label: 'Minecraft' },
    { slug: 'roblox', label: 'Roblox' },
    { slug: 'curseforge', label: 'CurseForge' },
    { slug: 'itchdotio', label: 'itch.io' },
    { slug: 'gogdotcom', label: 'GOG' }
  ]
};

function iconUrl(slug, color = 'ffffff') {
  return `https://api.iconify.design/simple-icons/${slug}.svg?color=%23${color.replace('#', '')}`;
}
