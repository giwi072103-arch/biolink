module.exports = function defaultProfile(username) {
  return {
    displayName: username,
    bio: '',
    avatarUrl: '',
    background: {
      type: 'none',      // none | image | video | color
      url: '',
      blur: 12,           // px
      brightness: 0.55,   // 0..1, darkens the media under the glass card
      color: '#0b0d14'
    },
    theme: {
      accent: '#7c5cff',
      accent2: '#22d3ee',
      glass: 'liquid',     // liquid | frosted | solid
      particles: true,
      cursorGlow: true
    },
    socials: [],           // { icon: 'discord', label: 'Discord', url: '' }
    music: {
      tracks: [],          // { title, url, source: 'upload' | 'link' }
      autoplay: false,
      showVisualizer: true
    },
    layout: {
      order: ['avatar', 'bio', 'socials', 'links']
    }
  };
};
